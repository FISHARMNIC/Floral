
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

export module showcase3;


export struct Report {
            Daisy::String name;
Daisy::List<Daisy::String> expenses;
            };
DAISY_FUNCTION(Daisy::Integer, calculator, Report& report, Daisy::SharedInteger total)
auto nums = Daisy::util::listmap(report.expenses, Daisy::util::toInteger);
auto sum = Daisy::util::listreduce(nums, [&](auto acc, auto x){ return acc + x; });
total->modify([&](auto __v){ return __v + sum; });
__DAISY_channel.send("About to do some more work...");
Daisy::Timing::sleep_ms(static_cast<Daisy::Integer>(50));
Daisy::builtin::io::print("Worker", report.name, "is done!");
return sum;

}
export Daisy::SharedInteger household = {};
export Daisy::Threads::Handler<Daisy::Integer> a = {};
export Daisy::Threads::Handler<Daisy::Integer> b = {};
export Daisy::Integer ra = {};
export Daisy::Integer rb = {};


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/showcase3.bud";

household = Daisy::NewShared(static_cast<Daisy::Integer>(0));
a = Daisy::Threads::spawn(calculator, ((Report){.name = "Nico",.expenses = Daisy::List<Daisy::String>({"100", "20", "35"})}), household);
b = Daisy::Threads::spawn(calculator, ((Report){.name = "Rio",.expenses = Daisy::List<Daisy::String>({"15", "150", "25"})}), household);
Daisy::builtin::io::print("waiting for notifications...");
Daisy::builtin::io::print("from a:", a.receive());
Daisy::builtin::io::print("from b:", b.receive());
ra = a.await();
rb = b.await();
Daisy::builtin::io::print(("Nico: " + Daisy::util::toString(ra) + " | Rio: " + Daisy::util::toString(rb) + " | Total: " + Daisy::util::toString(household)));


Daisy::Threads::join_all();
return 0;
}
}
