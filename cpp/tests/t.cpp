#include "../runtime/runtime.hpp"
#include <cstdint>
#include <cstdio>
#include <string>

DAISY_FUNCTION(Daisy::List<Daisy::String>, incrementer, Daisy::SharedInteger n, Daisy::Integer steps);

inline Daisy::SharedInteger counter = Daisy::NewShared(static_cast<uint64_t>(0));
DAISY_FUNCTION(Daisy::List<Daisy::String>, incrementer, Daisy::SharedInteger n, Daisy::Integer steps)
{
Daisy::Integer halfway = n->get() + steps / static_cast<uint64_t>(2);
while (n->get() < steps) {
Daisy::print("counter:", n);
if (n->get() == halfway) {
__DAISY_channel.send("Halfway there!");
}
Daisy::Timing::sleep_ms(static_cast<uint64_t>(50));
n->set(n->get() + static_cast<uint64_t>(1));
}
return Daisy::List<Daisy::String>({"hi", "bye"});

}

decltype(incrementer) handler;
decltype(handler.receive()) notification;
decltype(handler.await()) res;


int main() {
handler = Daisy::Threads::spawn(incrementer , counter, static_cast<uint64_t>(10));
Daisy::print("doing work on the main thread...");
notification = handler.receive();
Daisy::print("Got notification:", notification);
res = handler.await();
Daisy::print("Returned:", res);
Daisy::print("final counter:", counter);
counter->set(static_cast<uint64_t>(0));
res = Daisy::Threads::call(incrementer , counter, static_cast<uint64_t>(10));
Daisy::print(res);
  Daisy::Threads::join_all();
  return 0;
}
