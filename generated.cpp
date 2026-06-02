#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

inline auto b = Daisy::List<Daisy::String>({"apples", "oranges"});


int main() {
auto a = Daisy::List<Daisy::Integer>({static_cast<uint64_t>(1), static_cast<uint64_t>(2), static_cast<uint64_t>(3), static_cast<uint64_t>(4)});
  Daisy::Threads::join_all();
  return 0;
}
