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

template <typename T> struct TimeoutResponse {
    T returnValue;
    bool fail = true;
};

// @todo not ready for use
template <typename T>
inline TimeoutResponse<T> timeout(Daisy::Integer time_ms, Threads::Handler<T>&& child)
{
    auto status = child.handle.wait_for(std::chrono::milliseconds(time_ms));

    TimeoutResponse<T> res;
    if (status == std::future_status::timeout) {
        child.channel.channel->killchild->store(true);
        res.fail = true;
    }
    else {
        res.fail = false;
        res.returnValue = Daisy::Threads::await(child.handle);
    }

    return res;
}

template <typename T>
inline TimeoutResponse<T> timeout(Daisy::Integer time_ms, Threads::Handler<T>& child)
{
    return timeout(time_ms, std::move(child));
}
} // namespace Timing
} // namespace Daisy
