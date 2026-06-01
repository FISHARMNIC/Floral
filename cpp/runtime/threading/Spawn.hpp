#ifndef THREADING_SPAWN_H
#define THREADING_SPAWN_H

#include <future>

#include "Channel.hpp"

namespace Daisy
{
    namespace Threads
    {
        template <typename T>
        inline T await(std::future<T> &f)
        {
            return f.get();
        }

        template <typename T>
        struct Handler {
            std::future<T> handle;
            MasterChannel channel;

            inline Daisy::String receive()
            {
                return channel.receive();
            }

            inline void send(std::string data = "")
            {
                channel.send(data);
            }

            inline T await()
            {
                return Daisy::Threads::await(this->handle);
            }
        };

        // run on new thread
        template <typename FuncT, typename... ArgsT>
        auto spawn(FuncT &function, ArgsT &&...args)
        {
            auto [master, slave] = Daisy::Threads::make_channel();
            auto future = std::async(std::launch::async,
                                     std::forward<FuncT>(function),
                                     slave,
                                     std::forward<ArgsT>(args)...);
            using ReturnType = std::invoke_result_t<std::decay_t<FuncT>, Daisy::Threads::SlaveChannel, std::decay_t<ArgsT>...>;
            return Handler<ReturnType>{std::move(future), master};
        }

        
        // run on single thread
        template <typename FuncT, typename... ArgsT>
        auto call(FuncT &function, ArgsT &&...args)
        {
            _FakeSlaveChannel channel;
            
            return function(channel, std::forward<ArgsT>(args)...);
        }
    }
}

#define DAISY_FUNCTION(rt, name, ...) rt name(Daisy::Threads::SlaveChannel __DAISY_channel __VA_OPT__(,) __VA_ARGS__)

#endif