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
    T res = T{};
    bool fail = true;
};

template <typename T>
inline TimeoutResponse<T> timeout(Threads::Handler<T>&& child, Daisy::Integer time_ms)
{
    auto status = child.handle.wait_for(std::chrono::milliseconds(time_ms));

    TimeoutResponse<T> res;
    if (status == std::future_status::timeout) {
        child.channel.channel->killchild->store(true);
        res.fail = true;
    }
    else {
        res.fail = false;
        res.res = Daisy::Threads::await(child.handle);
    }

    return res;
}

template <typename T>
inline TimeoutResponse<T> timeout(Threads::Handler<T>& child, Daisy::Integer time_ms)
{
    return timeout(std::move(child), time_ms);
}
} // namespace Timing
} // namespace Daisy
