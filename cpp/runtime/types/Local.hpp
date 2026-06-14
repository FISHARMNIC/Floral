#pragma once

#include <memory>
#include <vector>

#include "../threading/Channel.hpp"
#include "Types.hpp"

namespace Daisy {
template <typename T> class Local {
    
    std::shared_ptr<T> ptr;

    public:

    Local(): ptr(std::make_shared<T>({})) {}
    Local(T value): ptr(std::make_shared<T>(value)) {}
    Local(Local &&other) : ptr(std::move(other.ptr)) {}
    Local(const Local &other) : ptr(other.ptr) {}

    Local thread_local_copy() const
    {
        Local l;
        l.ptr = std::make_shared<T>(*ptr);
        return l;
    }

    T& get()
    {
        return *ptr;
    }
};
} // namespace Daisy