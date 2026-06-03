#ifndef DAISY_UTIL_METHODS_H
#define DAISY_UTIL_METHODS_H

#include "../types/Types.hpp"
#include <sstream>

namespace Daisy {
namespace util {

// String
List<String> strsplit(const String &s, const String &delim);
Integer      strlength(const String &s);
String       strslice(const String &s, Integer start, Integer end = -1);
Integer      strindexof(const String &s, const String &find);
String       strat(const String &s, Integer i);
Integer      strtoint(const String &s);
Float        strtofloat(const String &s);

// Integer
Float inttofloat(Integer i);

// List — templates must remain in the header

template <typename T>
Integer listlength(const List<T> &v)
{
    return static_cast<Integer>(v.size());
}

template <typename T>
String listjoin(const List<T> &v, const String &sep)
{
    std::ostringstream oss;
    for (size_t i = 0; i < v.size(); ++i) {
        if (i > 0)
            oss << sep;
        oss << v[i];
    }
    return oss.str();
}

template <typename T, typename F>
auto listmap(const List<T> &v, F fn)
{
    using R = decltype(fn(v[0]));
    List<R> result;
    result.reserve(v.size());
    for (const auto &item : v)
        result.push_back(fn(item));
    return result;
}

template <typename T, typename F>
List<T> listfilter(const List<T> &v, F fn)
{
    List<T> result;
    for (const auto &item : v)
        if (fn(item))
            result.push_back(item);
    return result;
}

template <typename T, typename F>
auto listreduce(const List<T> &v, F fn)
{
    using R = decltype(fn(v[0], v[1]));
    R accum = R{};
    for (const auto &item : v)
        accum = fn(accum, item);
    return accum;
}

} // namespace util
} // namespace Daisy

#endif
