#include "types/Types.hpp"
#include "threading/Spawn.hpp"
#include "threading/Channel.hpp"

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
    void print(const T& arg)
    {
        if constexpr (IsShared<T>::value) {
            std::cout << arg->get() << std::endl;
        } else {
            std::cout << arg << std::endl;
        }
    }
}

Daisy::String _fileread(Daisy::String file);
std::vector<std::string> _split(const std::string &str, const std::string &delim);