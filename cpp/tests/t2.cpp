#include "../runtime/runtime.hpp"
#include <cstdio>
#include <string>

DAISY_FUNCTION(void, myChild) {
  __DAISY_channel.send("Knock Knock");
  while (true) {
    std::string recv = __DAISY_channel.receive();
    Daisy::print(recv);
    if (recv == "Who is there?")
      __DAISY_channel.send("Your child!");
    else if (recv == "Oh hi!")
    {
      __DAISY_channel.send("Wassup");
      break;
    }
  }
}

int main() {
  auto handler = Daisy::Threads::spawn(myChild);

  while (true) {
    std::string recv = handler.receive();
    Daisy::print(recv);
    if (recv == "Knock Knock")
      handler.send("Who is there?");
    else if (recv == "Your child!")
      handler.send("Oh hi!");
    else if (recv == "Wassup")
      break;
  }

  handler.await();

  return 0;
}