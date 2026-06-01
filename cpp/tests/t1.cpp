#include "../runtime/runtime.hpp"

int main() {
  Daisy::String path = Daisy::NewShared("test.txt");
  auto res = Daisy::Threads::spawn(_fileread, path);
  Daisy::print(Daisy::Threads::await(res));
  return 0;
}