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
if (recv == "Who is there?") {
__DAISY_channel.send("Your child!");
}
else if (recv == "Oh hi!") {
__DAISY_channel.send("Wassup");
break;
}
}

}


int main() {
auto child = Daisy::Threads::spawn(myChild  );
while (true) {
Daisy::String recv = child.receive();
Daisy::print(recv);
if (recv == "Knock Knock") {
child.send("Who is there?");
}
else if (recv == "Your child!") {
child.send("Oh hi!");
}
else if (recv == "Wassup") {
break;
}
}
  return 0;
}
