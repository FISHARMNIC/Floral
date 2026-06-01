#include "../runtime/runtime.hpp"
#include <string>

DAISY_FUNCTION(void, myChild)
{
    __DAISY_channel.send("Knock Knock");
    while (true) {
        std::string recv = __DAISY_channel.receive();
        Daisy::print(recv);
        if (recv == "Who is there?")
            __DAISY_channel.send("Your child!");
        else if (recv == "Oh hi!") {
            __DAISY_channel.send("Wassup");
            break;
        }
    }
}

DAISY_FUNCTION(void, myOtherChid)
{
    __DAISY_channel.send("I'm Hungry");
    while (true) {
        std::string recv = __DAISY_channel.receive();
        Daisy::print(recv);
        if (recv == "Hi Hungry im dad") {
            __DAISY_channel.send("bruh.");
            break;
        }
    }
}

int main()
{
    auto child1 = Daisy::Threads::spawn(myChild);
    auto child2 = Daisy::Threads::spawn(myOtherChid);

    while (true) {
        std::string recv = child1.receive();
        Daisy::print(recv);
        if (recv == "Knock Knock")
            child1.send("Who is there?");
        else if (recv == "Your child!")
            child1.send("Oh hi!");
        else if (recv == "Wassup")
            break;
    }

    while (true) {
        std::string recv = child2.receive();
        Daisy::print(recv);
        if (recv == "I'm Hungry")
            child2.send("Hi Hungry im dad");
        else if (recv == "bruh.")
            break;
    }

    child1.await();
    child2.await();

    return 0;
}