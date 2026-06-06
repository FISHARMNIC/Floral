#pragma once

#include <chrono>
#include <cstdint>
#include <thread>

#include "Spawn.hpp"

namespace Daisy {
    namespace Timing {

        inline void sleep_ms(uint64_t milliseconds)
        {
            std::this_thread::sleep_for(std::chrono::milliseconds(milliseconds));
        } 

        template <typename T>
        struct TimeoutResponse
        {
            T returnValue;
            bool fail = true;
        } ;

        // @todo not ready for use
        template<typename T>
        inline TimeoutResponse<T> timeout(Daisy::Integer time_ms, T& fn)
        {
            auto child= Daisy::Threads::spawn(fn);
            child.handle.wait_for(std::chrono::milliseconds(time_ms)) == std::future_status::ready;

            // @todo if finished before the timeout then this will block until timeout
            TimeoutResponse<T> res;
            if(child.done())
            {
                res.fail = false;
                res.returnValue = child.await();
            }
            
            // @todo signal to kill 

            return res;
        }
    }
}
