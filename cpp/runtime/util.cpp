#include "runtime.hpp"

Daisy::String _fileread(const Daisy::String& file) {
  std::uintmax_t size = std::filesystem::file_size(file);
  Daisy::String content(size, '\0');
  std::ifstream in(file);
  in.read(&content[0], size);
  return content;
}

std::vector<Daisy::String> _split(const Daisy::String &str,
                                const Daisy::String &delim) {
  std::vector<Daisy::String> result;
  size_t start = 0;
  size_t end = str.find(delim);
  while (end != Daisy::String::npos) {
    result.push_back(str.substr(start, end - start));
    start = end + delim.length();
    end = str.find(delim, start);
  }
  result.push_back(str.substr(start));
  return result;
}