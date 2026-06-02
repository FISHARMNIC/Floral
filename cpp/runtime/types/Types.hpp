#ifndef TYPES_SHARED_H
#define TYPES_SHARED_H

#include <cstdint>
#include <string>
#include <thread>
#include <stdint.h>

namespace Daisy
{
    template<typename T>
    struct _SharedData {
        T value;
        std::mutex mtx;

        _SharedData(T val) : value(val) {}

        void set(const T& newValue) {
            std::lock_guard<std::mutex> lock(mtx);
            value = newValue;
        }

        T get() {
            std::lock_guard<std::mutex> lock(mtx);
            return value;
        }
    };

    template<typename T>
    using _Shared = std::shared_ptr<_SharedData<T>>;

    // Raw (unwrapped) types
    using Integer = uint64_t;
    using String = std::string;
    using Float = double;

    // Shared (wrapped) types
    using SharedInteger = Daisy::_Shared<uint64_t>;
    using SharedString = Daisy::_Shared<std::string>;
    using SharedFloat = Daisy::_Shared<double>;

    template<typename T>
    auto NewShared(const T& value) {
        if constexpr (std::is_same_v<std::decay_t<T>, const char*> || std::is_array_v<T>) {
            return std::make_shared<_SharedData<std::string>>(std::string(value));
        } else {
            return std::make_shared<_SharedData<T>>(value);
        }
    }
}

// #define DAISY_NEWVAR() // @todo

#endif