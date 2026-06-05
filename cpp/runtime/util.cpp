#include "runtime.hpp"
#include <cstdio>

// @todo some of these should just be inline in hpp

namespace Daisy {
namespace util {

List<String> strsplit(const String &s, const String &delim)
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

Integer strlength(const String &s) { return static_cast<Integer>(s.size()); }

String strslice(const String &s, Integer start, Integer end)
{
    Integer len = static_cast<Integer>(s.size());
    if (start < 0)
        start = std::max<Integer>(0, len + start);
    if (end < 0)
        end = len;
    start = std::min(start, len);
    end = std::min(end, len);
    if (end <= start)
        return "";
    return s.substr(static_cast<size_t>(start),
                    static_cast<size_t>(end - start));
}

Integer strindexof(const String &s, const String &find)
{
    auto found = s.find(find);
    return found == std::string::npos ? -1 : static_cast<Integer>(found);
}

String strat(const String &s, Integer i)
{
    Integer len = static_cast<Integer>(s.size());
    if (i < 0)
        i = len + i;
    return String(1, s.at(static_cast<size_t>(i)));
}

Integer strtoint(const String &s)
{
    return static_cast<Integer>(std::stoull(s));
}

Float strtofloat(const String &s) { return std::stod(s); }

Float inttofloat(Integer i) { return static_cast<Float>(i); }

} // namespace util

namespace builtin {
namespace file {
String read(const String &file)
{
    try {
        std::uintmax_t size = std::filesystem::file_size(file);
        String content(size, '\0');
        std::ifstream in(file);
        in.read(&content[0], size);
        return content;
    }
    catch (...) {
        return "";
    }
}

String _exe_path;

String resolve(const String &filename)
{
    static auto exe_parent_path =
        std::filesystem::path(_exe_path).parent_path();
    return (exe_parent_path / filename).string();
}

Bool write(const String &path, const String &content)
{
    try {
        std::ofstream out(path, std::ios::out | std::ios::trunc);
        out << content;
        return out.good();
    }
    catch (...) {
        return false;
    }
}

Bool append(const String &path, const String &content)
{
    try {
        std::ofstream out(path, std::ios::app);
        out << content;
        return out.good();
    }
    catch (...) {
        return false;
    }
}

Bool exists(const String &path) { return std::filesystem::exists(path); }

Bool remove(const String &path)
{
    try {
        return std::filesystem::remove(path);
    }
    catch (...) {
        return false;
    }
}

Bool mkdir(const String &path)
{
    try {
        return std::filesystem::create_directories(path);
    }
    catch (...) {
        return false;
    }
}

Integer size(const String &path)
{
    try {
        return static_cast<Integer>(std::filesystem::file_size(path));
    }
    catch (...) {
        return -1;
    }
}

List<String> list(const String &path)
{
    List<String> result;
    try {
        for (const auto &entry : std::filesystem::directory_iterator(path)) {
            result.push_back(entry.path().filename().string());
        }
    }
    catch (...) {
    }
    return result;
}

} // namespace file

namespace process {
String exec(const String& path)
{
    FILE *pipe = popen(path.c_str(), "r");
    String result;
    char tmp[256];
    while (fgets(tmp, sizeof(tmp), pipe)) {
        result += tmp;
    }
    pclose(pipe);
    return result;
}
} // namespace process

namespace web {
String fetch(const String &url)
{
  return Daisy::builtin::process::exec("curl -s " + url); // @todo slow and unsafe
}
}
} // namespace builtin

} // namespace Daisy
