#include "../runtime/runtime.hpp"
#include <cstdint>
#include <cstdio>
#include <string>

DAISY_FUNCTION(void, bob, Daisy::SharedInteger poop)
{
Daisy::SharedInteger a = poop->get();

}


int main() {
  Daisy::Threads::join_all();
  return 0;
}
