// @todo this file is a mess...

#ifndef DAISY_UTIL_METHODS_H
#define DAISY_UTIL_METHODS_H

#include <filesystem>
#include <fstream>
#include <iostream>
#include <memory>
#include <mutex>
#include <sstream>
#include <string>
#include <vector>

#include "../types/Types.hpp"
#include <sstream>

namespace Daisy {
namespace util {

// @todo separate into sub namespaces
// String
List<String> strsplit(const String &s, const String &delim);
Integer strlength(const String &s);
String strslice(const String &s, Integer start, Integer end = -1);
Integer strindexof(const String &s, const String &find);
String strat(const String &s, Integer i);
Integer strtoint(const String &s);
Float strtofloat(const String &s);

// Integer
Float inttofloat(Integer i);

// List — templates must remain in the header

template <typename T> Integer listlength(const List<T> &v)
{
    return static_cast<Integer>(v.size());
}

template <typename T> String listjoin(const List<T> &v, const String &sep)
{
    std::ostringstream oss;
    for (size_t i = 0; i < v.size(); ++i) {
        if (i > 0)
            oss << sep;
        oss << v[i];
    }
    return oss.str();
}

template <typename T, typename F> auto listmap(const List<T> &v, F fn)
{
    using R = decltype(fn(v[0]));
    List<R> result;
    result.reserve(v.size());
    for (const auto &item : v)
        result.push_back(fn(item));
    return result;
}

template <typename T, typename F> void listfeach(const List<T> &v, F fn)
{
    for (const auto &item : v)
        fn(item);
}

template <typename T, typename F> List<T> listfilter(const List<T> &v, F fn)
{
    List<T> result;
    for (const auto &item : v)
        if (fn(item))
            result.push_back(item);
    return result;
}

template <typename T, typename F> auto listreduce(const List<T> &v, F fn)
{
    using R = decltype(fn(v[0], v[1]));
    R accum = R{};
    for (const auto &item : v)
        accum = fn(accum, item);
    return accum;
}

template <typename T> void listpush(List<T> &v, const T &item)
{
    v.push_back(item);
}

template <typename T> T listpop(List<T> &v)
{
    T val = v.back();
    v.pop_back();
    return val;
}

template <typename T> void listpushFront(List<T> &v, const T &item)
{
    v.insert(v.begin(), item);
}

template <typename T> T listpopFront(List<T> &v)
{
    T val = v.front();
    v.erase(v.begin());
    return val;
}

template <typename T> void listdelete(List<T> &v, Integer index)
{
    v.erase(v.begin() + static_cast<std::ptrdiff_t>(index));
}

} // namespace util
namespace builtin {
namespace file {

extern String _exe_path;
String read(const String &path);
String resolve(const String &filename);
Bool write(const String &path, const String &content);
Bool append(const String &path, const String &content);
Bool exists(const String &path);
Bool remove(const String &path);
Bool mkdir(const String &path);
Integer size(const String &path);
List<String> list(const String &path);

} // namespace file
namespace process {
String exec(const String &path);
}

namespace web {
String fetch(const String &url);
}

namespace io {

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

// @todo make not inline
inline std::mutex _output_mutex;
inline std::mutex _input_mutex;

template <typename... Args> void print(const Args &...args)
{
    std::lock_guard<std::mutex> lock(_output_mutex);
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

template <typename T> inline String prompt(T arg = T{})
{
    std::lock_guard<std::mutex> lock(_input_mutex);
    print(arg);
    String out;
    std::cin.clear();
    std::getline(std::cin, out);
    return out;
}
} // namespace io
} // namespace builtin
} // namespace Daisy

#endif
