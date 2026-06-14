#pragma once

#include <memory>
#include <vector>

#include "../threading/Channel.hpp"
#include "Types.hpp"

namespace Daisy {
template <typename T> class _Local {

    std::shared_ptr<T> ptr;

  public:
    _Local() : ptr(std::make_shared<T>()) {}
    _Local(T value) : ptr(std::make_shared<T>(std::move(value))) {}
    _Local(_Local &&other) noexcept : ptr(std::move(other.ptr)) {}
    _Local(const _Local &other) : ptr(other.ptr) {}
    _Local &operator=(_Local &&other) noexcept { ptr = std::move(other.ptr); return *this; }
    _Local &operator=(const _Local &other) { ptr = other.ptr; return *this; }

    _Local copyOnThread() const
    {
        _Local l;
        l.ptr = std::make_shared<T>(*ptr);
        return l;
    }

    T &get() { return *ptr; }
    const T &get() const { return *ptr; }
};

template <typename T> using LocalList = _Local<List<T>>;

} // namespace Daisy