#pragma once

#include <chrono>
#include <cstdio>
#include <exception>
#include <future>
#include <stdexcept>
#include <vector>

#include "Channel.hpp"

namespace Daisy {
namespace Threads {

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
    inline bool canReceive()       { return channel.canReceive(); }
    inline Daisy::Integer pending(){ return channel.pending(); }
    inline void send(Daisy::String data = "") { channel.send(data); }

    void _drain(std::shared_ptr<_Channel>& ch) {
            for (auto &f : ch->detached_futures)
            {
                if (f.valid()) 
                {
                    std::printf("Draining %p\n", &f);
                    f.get();
                }
            }
            ch->detached_futures.clear();
        };

    inline T await()
    {
        if (Threads::activeSlaveChannel.channel->killchild->load())
            throw std::runtime_error("await after timeout");

        if constexpr (std::is_void_v<T>) {
            Daisy::Threads::await(this->handle);
            _drain(this->channel.channel);
        } else {
            T result = Daisy::Threads::await(this->handle);
            _drain(this->channel.channel);
            return result;
        }
    }

    inline bool done() { return Daisy::Threads::done(this->handle); }

    // Fire-and-forget: push a deferred future into the current thread's channel.
    // The closure awaits the child then drains the child's own detached futures,
    // so back-propagation is recursive.
    ~Handler()
    {
        if (handle.valid()) {
            auto child_ch = this->channel.channel;
            Threads::activeSlaveChannel.channel->detached_futures.push_back(
                std::async(std::launch::deferred,
                    [h = std::move(const_cast<std::future<T> &>(handle)), child_ch]() mutable {
                        try {
                            (void)h.get();
                            for (auto &f : child_ch->detached_futures)
                                if (f.valid()) f.get();
                            child_ch->detached_futures.clear();
                        } catch (...) {}
                    }));
        }
    }
};

// Join all fire-and-forget threads spawned on the main thread - call at end of main
inline void join_all()
{
    for (auto &f : activeSlaveChannel.channel->detached_futures)
        if (f.valid()) f.get();
    activeSlaveChannel.channel->detached_futures.clear();
}

// run on new thread
template <typename FuncT, typename... ArgsT>
auto spawn(FuncT &&function, ArgsT &&...args)
{
    checkAlive();
    auto [master, slave] = Daisy::Threads::make_channel();
    using ReturnType = std::invoke_result_t<std::decay_t<FuncT>, Daisy::Threads::SlaveChannel, std::decay_t<ArgsT>...>;
    auto future = std::async(std::launch::async, std::forward<FuncT>(function),
                             std::move(slave), std::forward<ArgsT>(args)...);
    return Handler<ReturnType>{std::move(future), std::move(master)};
}

// run on single thread
template <typename FuncT, typename... ArgsT>
auto call(FuncT &function, ArgsT &&...args)
{
    checkAlive();
    return function(activeSlaveChannel, std::forward<ArgsT>(args)...);
}
} // namespace Threads
} // namespace Daisy

#define DAISY_FUNCTION(rt, name, ...)                                          \
    export rt name(Daisy::Threads::SlaveChannel __DAISY_channel __VA_OPT__(, ) \
                       __VA_ARGS__)                                            \
    {                                                                          \
        Daisy::Threads::activeSlaveChannel = __DAISY_channel;

#define CALLABLE_METHOD(rt, name, ...)                                         \
    rt name(__VA_ARGS__)                                                       \
    {                                                                          \
        Daisy::Threads::checkAlive();
