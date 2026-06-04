#include "threading/Channel.hpp"
#include "threading/Spawn.hpp"
#include "threading/Timing.hpp"
#include "types/Types.hpp"
#include "util/methods.hpp"

#include <filesystem>
#include <fstream>
#include <iostream>
#include <memory>
#include <mutex>
#include <sstream>
#include <string>
#include <vector>

namespace Daisy {
template <typename T> struct IsShared : std::false_type {};

template <typename T>
struct IsShared<std::shared_ptr<_SharedData<T>>> : std::true_type {};

template <typename T> struct IsVector : std::false_type {};

template <typename T> struct IsVector<std::vector<T>> : std::true_type {};

template <typename T>
struct IsString
    : std::integral_constant<bool,
                             std::is_same_v<std::string, std::decay_t<T>>> {};

template <typename T> void _printOne(const T &arg)
{
    if constexpr (IsShared<T>::value) {
        _printOne(arg->get());
    }
    else if constexpr (IsVector<T>::value) {
        std::cout << "[";
        for (std::size_t i = 0; i < arg.size(); ++i) {
            if (i > 0)
                std::cout << ", ";
            if constexpr (IsString<decltype(arg[i])>::value) {
                _printOne("\"" + arg[i] + "\"");
            }
            else {
                _printOne(arg[i]);
            }
        }
        std::cout << "]";
    }
    else {
        std::cout << arg;
    }
}

inline std::mutex _print_mutex;

template <typename... Args> void print(const Args &...args)
{
    std::lock_guard<std::mutex> lock(_print_mutex);
    bool first = true;
    auto printArg = [&](const auto &arg) {
        if (!first)
            std::cout << " ";
        first = false;
        _printOne(arg);
    };
    (printArg(args), ...);
    std::cout << std::endl;
}

} // namespace Daisy

// std::vector<Daisy::String> _split(const Daisy::String &str, const
// Daisy::String &delim);