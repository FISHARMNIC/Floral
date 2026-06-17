#pragma once

#include <type_traits>
#include <vector>

#include "Types.hpp"
#include "../threading/Channel.hpp"

// #define DAISY_TCANCEL "__DTHREAD_CANCELLED__"

template<typename>
struct is_std_vector : std::false_type {};

template<typename T, typename A>
struct is_std_vector<std::vector<T,A>> : std::true_type {};

namespace Daisy {

template <typename T> 
struct Signal
{
    std::mutex cv_mutex;
    std::condition_variable cv;
    std::conditional_t<!std::is_same_v<T, void>, T, std::monostate> val;

    // @todo cleanup
    template <typename U = T>
    std::enable_if<!std::is_same<U, void>::value, U>::type wait()
    {
        Threads::checkAlive();
        std::unique_lock<std::mutex> lock(cv_mutex);
        cv.wait(lock);
        return val;
    }

    template <typename U = T>
    typename std::enable_if<std::is_same<U, void>::value>::type wait()
    {
        Threads::checkAlive();
        std::unique_lock<std::mutex> lock(cv_mutex);
        cv.wait(lock);
    }

    template <typename U = T>
    typename std::enable_if<!std::is_same<U, void>::value>::type notify(U nv = U{})
    {
        Threads::checkAlive();
        std::lock_guard<std::mutex> lock(cv_mutex);
        val = nv;
        cv.notify_all();
    }

    template <typename U = T>
    typename std::enable_if<std::is_same<U, void>::value>::type notify()
    {
        Threads::checkAlive();
        std::lock_guard<std::mutex> lock(cv_mutex);
        cv.notify_all();
    }
};


template <typename T> struct _SharedData {
    T value;
    std::mutex mtx;

    _SharedData(T val) : value(val) {}

    void set(const T &newValue)
    {
        Threads::checkAlive();
        std::lock_guard<std::mutex> lock(mtx);

        value = newValue;
    }

    T& get()
    {
        Threads::checkAlive();
        std::lock_guard<std::mutex> lock(mtx);

        return value;
    }

    template <typename F>
    void modify(F fn)
    {
        Threads::checkAlive();
        std::lock_guard<std::mutex> lock(mtx);
        
        value = fn(value);
    }

    template <typename U = T, typename F>
    typename std::enable_if<is_std_vector<U>::value>::type setAt(size_t i, F fn)
        requires std::ranges::range<U>
    {
        Threads::checkAlive();
        std::lock_guard<std::mutex> lock(mtx);

        value[i] = fn(value[i]);
    }

    template <typename MemberPtr, typename F>
    void setProperty(MemberPtr field, F fn)
        requires std::is_class_v<T> && std::is_member_pointer_v<MemberPtr>
    {
        Threads::checkAlive();
        std::lock_guard<std::mutex> lock(mtx);

        value.*field = fn(value.*field);
    }

    // typename T::value_type getAt(size_t i)
    //     requires std::ranges::range<T>
    // {
    //     std::lock_guard lock(mtx);
    //     return value[i];
    // }
};

template <typename T> using _Shared = std::shared_ptr<_SharedData<T>>;

// Shared (wrapped) types
using SharedInteger = _Shared<Integer>;
using SharedString = _Shared<String>;
using SharedFloat = _Shared<Float>;
using SharedBool = _Shared<Bool>;
using SharedByte = _Shared<Byte>;

template <typename T> using SharedList = _Shared<List<T>>;

template <typename T> auto NewShared(const T &value)
{
    if constexpr (std::is_same_v<std::decay_t<T>, const char *> ||
                  std::is_array_v<T>) {
        return std::make_shared<_SharedData<String>>(String(value));
    }
    else {
        return std::make_shared<_SharedData<T>>(value);
    }
}
} // namespace Daisy

// #define DAISY_NEWVAR() // @todo