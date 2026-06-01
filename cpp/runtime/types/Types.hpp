#ifndef TYPES_SHARED_H
#define TYPES_SHARED_H

#include <string>
#include <thread>

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

    using String = Daisy::_Shared<std::string>; // @todo all strings are currently going to be shared, in the future will only be ones marked "shared", otherwise pased by value into thread

    template<typename T>
    auto NewShared(const T& value) {
        if constexpr (std::is_same_v<std::decay_t<T>, const char*> || std::is_array_v<T>) {
            return std::make_shared<_SharedData<std::string>>(std::string(value));
        } else {
            return std::make_shared<_SharedData<T>>(value);
        }
    }
}

#endif