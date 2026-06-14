#pragma once

#include <numbers>
#include <random>

#include "../types/Types.hpp"

namespace Daisy {
namespace math {

inline Float pi() { return std::numbers::pi_v<Float>; }

inline std::mt19937 &_rng()
{
    static thread_local std::mt19937 engine(std::random_device{}());
    return engine;
}

inline Float random()
{
    return std::uniform_real_distribution<Float>(0.0, 1.0)(_rng());
}

inline Integer randomInt(Integer min, Integer max)
{
    return std::uniform_int_distribution<Integer>(min, max)(_rng());
}

} // namespace math
} // namespace Daisy
