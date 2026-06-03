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

        template<typename T>
        inline TimeoutResponse<T> timeout(Daisy::Integer time_ms, T& fn)
        {
            auto child= Daisy::Threads::spawn(fn);
            child.handle.wait_for(std::chrono::milliseconds(time_ms)) == std::future_status::ready;

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
