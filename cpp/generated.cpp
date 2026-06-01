#include "runtime/runtime.hpp"
#include <cstdint>
#include <cstdio>
#include <string>

DAISY_FUNCTION(void, myChild, )
{
__DAISY_channel.send("Knock Knock");
while (true) {
Daisy::String recv = __DAISY_channel.receive();
Daisy::print(recv);
if (recv->get() == "Who is there?") {
__DAISY_channel.send("Your child!");
}
else if (recv->get() == "Oh hi!") {
__DAISY_channel.send("Wassup");
break;
}
}

}
DAISY_FUNCTION(void, myOtherChild, )
{
__DAISY_channel.send("I'm Hungry");
while (true) {
Daisy::String recv = __DAISY_channel.receive();
Daisy::print(recv);
if (recv->get() == "Hi Hungry im dad") {
__DAISY_channel.send("bruh.");
break;
}
}

}


int main() {
auto child1 = Daisy::Threads::spawn(myChild  );
auto child2 = Daisy::Threads::spawn(myOtherChild  );
while (true) {
Daisy::String recv = child1.receive();
Daisy::print(recv);
if (recv->get() == "Knock Knock") {
child1.send("Who is there?");
}
else if (recv->get() == "Your child!") {
child1.send("Oh hi!");
}
else if (recv->get() == "Wassup") {
break;
}
}
while (true) {
Daisy::String recv = child2.receive();
Daisy::print(recv);
if (recv->get() == "I'm Hungry") {
child2.send("Hi Hungry im dad");
}
else if (recv->get() == "bruh.") {
break;
}
}
child1.await();
child2.await();
  return 0;
}
