#ifndef TYPES_TYPES_H
#define TYPES_TYPES_H

#include <cstdint>
#include <stdint.h>
#include <string>
#include <vector>

#define DAISY_TCANCEL "__DTHREAD_CANCELLED__"

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

#endif