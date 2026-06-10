#pragma once
#include <condition_variable>
#include <cstdint>
#include <stdint.h>
#include <string>
#include <vector>
#include <semaphore>
#include <mutex>
#include <condition_variable>
// #include "../threading/Channel.hpp"

#define DAISY_TCANCEL "__DTHREAD_CANCELLED__"

// @todo
// #define checkAlive_mac if(Daisy::Threads::activeSlaveChannel.channel && Daisy::Threads::activeSlaveChannel.channel->killchild->load()) {throw _CancelledException();}

namespace Daisy {

    namespace Threads {
        
    };

    struct _CancelledException : public std::exception {
    const char* what() const noexcept override {
        return DAISY_TCANCEL;
    }
};

using Integer = uint64_t;
using String = std::string;
using Float = double;
using Bool = bool;
template <typename T> using List = std::vector<T>;

template <typename T> 
struct Signal
{
    std::mutex cv_mutex;
    std::condition_variable cv;
    T val = T{};

    T wait()
    {
        // checkAlive_mac;
        std::unique_lock<std::mutex> lock(cv_mutex);
        cv.wait(lock);
        return val;
    }

    void notify(T nv = T{})
    {
        std::lock_guard<std::mutex> lock(cv_mutex);
        val = nv;
        cv.notify_all();
    }
};

} // namespace Daisy

// #define DAISY_NEWVAR() // @todo