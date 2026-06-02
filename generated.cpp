#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

inline Daisy::SharedInteger counter = Daisy::NewShared(static_cast<uint64_t>(0));
DAISY_FUNCTION(Daisy::Integer, incrementer, Daisy::SharedInteger n, Daisy::Integer steps)
{
Daisy::Integer halfway = counter->get() + steps / static_cast<uint64_t>(2);
while (n->get() < steps) {
Daisy::print("counter:", n);
if (n->get() == halfway) {
__DAISY_channel.send("Halfway there!");
}
Daisy::Timing::sleep_ms(static_cast<uint64_t>(50));
n->set(n->get() + static_cast<uint64_t>(1));
}
return static_cast<uint64_t>(123);

}


int main() {
auto handler = Daisy::Threads::spawn(incrementer , counter, static_cast<uint64_t>(10));
Daisy::print("doing work on the main thread...");
Daisy::String notification = handler.receive();
Daisy::print("Got notification:", notification);
Daisy::Integer res = handler.await();
Daisy::print("Returned:", res);
  Daisy::Threads::join_all();
  return 0;
}
