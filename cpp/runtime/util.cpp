#include "runtime.hpp"

Daisy::String _fileread(const Daisy::String& file) {
  std::uintmax_t size = std::filesystem::file_size(file);
  Daisy::String content(size, '\0');
  std::ifstream in(file);
  in.read(&content[0], size);
  return content;
}

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

Integer strlength(const String &s)
{
    return static_cast<Integer>(s.size());
}

String strslice(const String &s, Integer start, Integer end)
{
    Integer len = static_cast<Integer>(s.size());
    if (start < 0)
        start = std::max<Integer>(0, len + start);
    if (end < 0)
        end = len;
    start = std::min(start, len);
    end   = std::min(end, len);
    if (end <= start)
        return "";
    return s.substr(static_cast<size_t>(start), static_cast<size_t>(end - start));
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

Float strtofloat(const String &s)
{
    return std::stod(s);
}

Float inttofloat(Integer i)
{
    return static_cast<Float>(i);
}

} // namespace util
} // namespace Daisy
