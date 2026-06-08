#ifndef THREADING_SPAWN_H
#define THREADING_SPAWN_H

#include <chrono>
#include <exception>
#include <future>
#include <stdexcept>
#include <vector>

#include "Channel.hpp"

namespace Daisy {
namespace Threads {
// Registry of fire-and-forget futures — joined at program exit
inline std::vector<std::future<void>> _detached_futures;

template <typename T> inline T await(std::future<T> &f) { return f.get(); }

template <typename T> inline bool done(std::future<T> &f)
{
    return f.wait_for(std::chrono::seconds(0)) == std::future_status::ready;
}


template <typename T> struct Handler {
    std::future<T> handle;
    MasterChannel channel;

    Handler() = default;
    Handler(std::future<T> f, MasterChannel ch)
        : handle(std::move(f)), channel(std::move(ch))
    {
    }
    Handler(Handler &&) = default;
    Handler &operator=(Handler &&) = default;
    Handler(const Handler &) = delete;
    Handler &operator=(const Handler &) = delete;

    inline Daisy::String receive() { return channel.receive(); }

    inline bool canReceive() { return channel.canReceive(); }

    inline Daisy::Integer pending() { return channel.pending(); }

    inline void send(Daisy::String data = "") { channel.send(data); }

    inline T await()
    {
        if (Threads::activeSlaveChannel.channel &&
            Threads::activeSlaveChannel.channel->killchild->load()) {
            throw std::runtime_error("await after timeout");
        }
        return Daisy::Threads::await(this->handle);
    }

    inline bool done() { return Daisy::Threads::done(this->handle); }

    // When a Handler is discarded as a statement, move its future into the
    // registry so the thread keeps running and is joined at exit.
    ~Handler()
    {
        if (handle.valid())
            _detached_futures.push_back(
                std::async(std::launch::deferred,
                           [h = std::move(const_cast<std::future<T> &>(
                                handle))]() mutable {
                               try {
                                   (void)h.get();
                               }
                               catch (...) {
                               }
                           })); //@todo cleanup, just check channel before
    }
};

// Join all fire-and-forget threads — call at end of main
inline void join_all()
{
    for (auto &f : _detached_futures)
        if (f.valid())
            f.get();
    _detached_futures.clear();
}

// run on new thread
template <typename FuncT, typename... ArgsT>
auto spawn(FuncT &&function, ArgsT &&...args)
{
    checkAlive(); // unforch not the most optimized, adds tiny overhead, maybe @todo improve?
    auto [master, slave] = Daisy::Threads::make_channel();

    // auto wrapper = [slave,
    //                 f = std::forward<FuncT>(function)](ArgsT &&...a) mutable
    //                 {
    //     Daisy::Threads::activeSlaveChannel = slave;
    //     return f(slave, std::forward<ArgsT>(a)...);
    // }; // @todo move into DAISY_FUNCTION macro and just add a {
    // Daisy::Threads::activeSlaveChannel = slave

    // auto future = std::async(std::launch::async, std::move(wrapper),
    //                          std::forward<ArgsT>(args)...);

    auto future = std::async(std::launch::async, std::forward<FuncT>(function),
                             slave, std::forward<ArgsT>(args)...);
    using ReturnType =
        std::invoke_result_t<std::decay_t<FuncT>, Daisy::Threads::SlaveChannel,
                             std::decay_t<ArgsT>...>;
    return Handler<ReturnType>{std::move(future), master};
}

// run on single thread
template <typename FuncT, typename... ArgsT>
auto call(FuncT &function, ArgsT &&...args)
{
    checkAlive();
    _FakeSlaveChannel channel;
    return function(channel, std::forward<ArgsT>(args)...);
}
} // namespace Threads
} // namespace Daisy

#define DAISY_FUNCTION(rt, name, ...)                                          \
    export rt name(Daisy::Threads::SlaveChannel __DAISY_channel __VA_OPT__(, ) \
                       __VA_ARGS__)                                            \
    {                                                                          \
        Daisy::Threads::activeSlaveChannel = __DAISY_channel;

#endif