module;
export module poop;

#include "../runtime/runtime.hpp"
#include <cstdint>
#include <cstdio>
#include <string>

DAISY_FUNCTION(Daisy::String, myChild, Daisy::SharedInteger number)
    __DAISY_channel.send();
    Daisy::builtin::io::print(number);
    __DAISY_channel.receive();
    Daisy::builtin::io::print(number);
    return "All done!";
}

int main()
{
    Daisy::SharedInteger someNumber = Daisy::NewShared(static_cast<uint64_t>(111));

    auto child1 = Daisy::Threads::spawn(myChild, someNumber);

    child1.receive();
    someNumber->set(222);
    child1.send();
    Daisy::String res = child1.await();
    Daisy::builtin::io::print(res);

    // runs on same thread, send a recv do nothing
    auto singleRes = Daisy::Threads::call(myChild, someNumber);

    return 0;
}