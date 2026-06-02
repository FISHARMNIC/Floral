#include "runtime.hpp"

Daisy::String _fileread(const Daisy::String& file) {
  std::uintmax_t size = std::filesystem::file_size(file);
  std::string content(size, '\0');
  std::ifstream in(file);
  in.read(&content[0], size);
  return content;
}

std::vector<std::string> _split(const std::string &str,
                                const std::string &delim) {
  std::vector<std::string> result;
  size_t start = 0;
  size_t end = str.find(delim);
  while (end != std::string::npos) {
    result.push_back(str.substr(start, end - start));
    start = end + delim.length();
    end = str.find(delim, start);
  }
  result.push_back(str.substr(start));
  return result;
}