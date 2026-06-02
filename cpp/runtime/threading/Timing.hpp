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

    }
}
