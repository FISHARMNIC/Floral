#ifndef TYPES_SHARED_H
#define TYPES_SHARED_H

#include <cstdint>
#include <stdint.h>
#include <string>
#include <thread>
#include <vector>

template<typename>
struct is_std_vector : std::false_type {};

template<typename T, typename A>
struct is_std_vector<std::vector<T,A>> : std::true_type {};


namespace Daisy {
template <typename T> struct _SharedData {
    T value;
    std::mutex mtx;

    _SharedData(T val) : value(val) {}

    void set(const T &newValue)
    {
        std::lock_guard<std::mutex> lock(mtx);
        value = newValue;
    }

    T get()
    {
        std::lock_guard<std::mutex> lock(mtx);
        return value;
    }

    template <typename U = T>
    typename std::enable_if<is_std_vector<U>::value>::type setAt(size_t i, const typename U::value_type &val)
        requires std::ranges::range<U>
    {
        std::lock_guard lock(mtx);
        value[i] = val;
    }

    // typename T::value_type getAt(size_t i)
    //     requires std::ranges::range<T>
    // {
    //     std::lock_guard lock(mtx);
    //     return value[i];
    // }
};

template <typename T> using _Shared = std::shared_ptr<_SharedData<T>>;

// Raw (unwrapped) types
using Integer = uint64_t;
using String = std::string;
using Float = double;
using Bool = bool;

template <typename T> using List = std::vector<T>;

// Shared (wrapped) types
using SharedInteger = Daisy::_Shared<Integer>;
using SharedString = Daisy::_Shared<String>;
using SharedFloat = Daisy::_Shared<Float>;
using SharedBool = Daisy::_Shared<Bool>;

template <typename T> using SharedList = Daisy::_Shared<List<T>>;

template <typename T> auto NewShared(const T &value)
{
    if constexpr (std::is_same_v<std::decay_t<T>, const char *> ||
                  std::is_array_v<T>) {
        return std::make_shared<_SharedData<Daisy::String>>(Daisy::String(value));
    }
    else {
        return std::make_shared<_SharedData<T>>(value);
    }
}
} // namespace Daisy

// #define DAISY_NEWVAR() // @todo

#endif