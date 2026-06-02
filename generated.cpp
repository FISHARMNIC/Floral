#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

DAISY_FUNCTION(Daisy::String, knock, )
{
__DAISY_channel.send("knock knock");
Daisy::String question = __DAISY_channel.receive();
Daisy::print("child got:", question);
return "its me!";

}


int main() {
auto talker = Daisy::Threads::spawn(knock  );
Daisy::print("waiting for knock...");
Daisy::Timing::sleep_ms(static_cast<uint64_t>(20));
Daisy::String msg = talker.receive();
Daisy::print("main got:", msg);
talker.send("whos there?");
Daisy::String answer = talker.await();
Daisy::print("talker replied:", answer);
  Daisy::Threads::join_all();
  return 0;
}
