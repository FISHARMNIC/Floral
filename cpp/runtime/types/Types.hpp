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


} // namespace Daisy

// #define DAISY_NEWVAR() // @todo