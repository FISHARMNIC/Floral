#include "types/Types.hpp"
#include "threading/Spawn.hpp"
#include "threading/Channel.hpp"
#include "threading/Timing.hpp"

#include <iostream>
#include <memory>
#include <string>
#include <filesystem>
#include <fstream>
#include <vector>
#include <sstream>

namespace Daisy
{
    template <typename T>
    struct IsShared : std::false_type {};

    template <typename T>
    struct IsShared<std::shared_ptr<_SharedData<T>>> : std::true_type {};

    template <typename T>
    struct IsVector : std::false_type {};

    template <typename T>
    struct IsVector<std::vector<T>> : std::true_type {};

    template <typename T>
    void _printOne(const T& arg)
    {
        if constexpr (IsShared<T>::value) {
            _printOne(arg->get());
        } else if constexpr (IsVector<T>::value) {
            std::cout << "[";
            for (std::size_t i = 0; i < arg.size(); ++i) {
                if (i > 0) std::cout << ", ";
                _printOne(arg[i]);
            }
            std::cout << "]";
        } else {
            std::cout << arg;
        }
    }

    template <typename... Args>
    void print(const Args&... args)
    {
        bool first = true;
        auto printArg = [&](const auto& arg) {
            if (!first) std::cout << " ";
            first = false;
            _printOne(arg);
        };
        (printArg(args), ...);
        std::cout << std::endl;
    }
}

Daisy::String _fileread(const Daisy::String& file);
std::vector<Daisy::String> _split(const Daisy::String &str, const Daisy::String &delim);