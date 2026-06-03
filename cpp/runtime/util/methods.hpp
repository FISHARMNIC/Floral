#ifndef DAISY_UTIL_METHODS_H
#define DAISY_UTIL_METHODS_H

#include "../types/Types.hpp"
#include <sstream>
#include <stdexcept>
#include <iostream>

namespace Daisy {
namespace util {

// String

inline List<String> strsplit(const String &s, const String &delim)
{
    List<String> result;
    size_t start = 0, end = s.find(delim);
    while (end != String::npos) {
        result.push_back(s.substr(start, end - start));
        start = end + delim.size();
        end = s.find(delim, start);
    }
    result.push_back(s.substr(start));
    return result;
}

inline Integer strlength(const String &s)
{
    return static_cast<Integer>(s.size());
}

inline String strslice(const String &s, Integer start, Integer end)
{
    Integer len = static_cast<Integer>(s.size());
    if (start < 0) {
        start = std::max<Integer>(0, len + start);
    }
    if (end < 0) {
        end = std::max<Integer>(0, len + end);
    }
    start = std::min(start, len);
    end = std::min(end, len);
    if (end <= start) {
        return "";
    }
    return s.substr(static_cast<size_t>(start),
                    static_cast<size_t>(end - start));
}

inline String strat(const String &s, Integer i)
{
    Integer len = static_cast<Integer>(s.size());
    if (i < 0) {
        i = len + i;
    }
    return String(1, s.at(static_cast<size_t>(i)));
}

inline Integer strtoint(const String &s)
{
    return static_cast<Integer>(std::stoull(s));
}

inline Float strtofloat(const String &s) { return std::stod(s); }

// Integer

inline Float inttofloat(Integer i) { return static_cast<Float>(i); }

// List

template <typename T> inline Integer listlength(const List<T> &v)
{
    return static_cast<Integer>(v.size());
}

template <typename T>
inline String listjoin(const List<T> &v, const String &sep)
{
    std::ostringstream oss;
    for (size_t i = 0; i < v.size(); ++i) {
        if (i > 0)
            oss << sep;
        oss << v[i];
    }
    return oss.str();
}

template <typename T, typename F> inline auto listmap(const List<T> &v, F fn)
{
    using R = decltype(fn(v[0]));
    List<R> result;
    result.reserve(v.size());
    for (const auto &item : v) {
        result.push_back(fn(item));
    }
    return result;
}

template <typename T, typename F>
inline List<T> listfilter(const List<T> &v, F fn)
{
    List<T> result;
    for (const auto &item : v) {
        if (fn(item))
            result.push_back(item);
    }
    return result;
}

template <typename T, typename F>
inline auto listreduce(const List<T> &v, F fn)
{
    using R = decltype(fn(v[0], v[1]));
    R accum = R{};
    for (const auto &item : v) {
        // std::cout << "BEFORE: [" << accum << "] " << item << std::endl;
        accum = fn(accum, item);
        // std::cout << "AFTER : [" << accum << "] " << item << " - fn was - " << x << std::endl;
    }
    return accum;
}

} // namespace util
} // namespace Daisy

#endif
