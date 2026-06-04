#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

DAISY_FUNCTION(Daisy::Integer, calculator, Daisy::String name, Daisy::List<Daisy::String> expenses, Daisy::SharedInteger total)
{
auto nums = Daisy::util::listmap(expenses, Daisy::util::strtoint);
auto sum = Daisy::util::listreduce(nums, [&](auto acc, auto x){ return acc + x; });
total->modify([&](auto __v){ return __v + sum; });
__DAISY_channel.send("About to do some more work...");
Daisy::Timing::sleep_ms(static_cast<Daisy::Integer>(50));
Daisy::print("Worker", name, "is done!");
return sum;

}
inline Daisy::SharedInteger household;


int main(int argc, char* argv[]) {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/showcase3.bud";

household = Daisy::NewShared(static_cast<Daisy::Integer>(0));
auto a = Daisy::Threads::spawn(calculator , "Nico", Daisy::List<Daisy::String>({"100", "20", "35"}), household);
auto b = Daisy::Threads::spawn(calculator , "Rio", Daisy::List<Daisy::String>({"15", "150", "25"}), household);
Daisy::print("waiting for notifications...");
Daisy::print("from a:", a.receive());
Daisy::print("from b:", b.receive());
auto ra = a.await();
auto rb = b.await();
Daisy::print("Nico:", ra, "| Rio:", rb, "| Total:", household);


Daisy::Threads::join_all();
return 0;
}
