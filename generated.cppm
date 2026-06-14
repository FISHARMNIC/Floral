
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

export module showcase2;

DAISY_FUNCTION(Daisy::Integer, count, Daisy::String state, const Daisy::LocalList<Daisy::String> info, Daisy::SharedInteger total)
Daisy::Timing::sleep_ms(static_cast<Daisy::Integer>(20));
auto numbers = Daisy::LocalList<Daisy::Integer>(Daisy::util::listmap(info.get(), [&](auto x){ return Daisy::util::toInteger(x); }).get());
auto sum = Daisy::util::listreduce(numbers.get(), [&](auto ac, auto e){ return ac + e; });
total->modify([&](auto __v){ return __v + sum; });
Daisy::builtin::io::print("All done!", state);
return sum;

}
export Daisy::LocalList<Daisy::String> california = {};
export Daisy::LocalList<Daisy::String> colorado = {};
export Daisy::LocalList<Daisy::String> texas = {};
export Daisy::SharedInteger population = {};
export Daisy::Threads::Handler<Daisy::Integer> c1 = {};
export Daisy::Threads::Handler<Daisy::Integer> c2 = {};
export Daisy::Threads::Handler<Daisy::Integer> c3 = {};
export Daisy::Integer i = {};
export Daisy::Integer con_cal = {};
export Daisy::Integer con_col = {};
export Daisy::Integer con_tex = {};


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/showcase2.bud";

california = Daisy::LocalList<Daisy::String>(Daisy::List<Daisy::String>{"100 : Northern", "300 : Central", "100 : Southern"});
colorado = Daisy::LocalList<Daisy::String>(Daisy::List<Daisy::String>{"50 : Northern", "10 : Central", "20 : Southern"});
texas = Daisy::LocalList<Daisy::String>(Daisy::List<Daisy::String>{"70 : Northern", "30 : Cetran", "120 : Southern"});
population = Daisy::NewShared(static_cast<Daisy::Integer>(0));
c1 = Daisy::Threads::spawn(count, "California", california, population);
c2 = Daisy::Threads::spawn(count, "Colorado", colorado, population);
c3 = Daisy::Threads::spawn(count, "Texas", texas, population);
Daisy::builtin::io::print("Simulating some work on the main thread...");
i = static_cast<Daisy::Integer>(0);
while (i < static_cast<Daisy::Integer>(10)) {
i = i + static_cast<Daisy::Integer>(1);
Daisy::builtin::io::print("Some busy counter", i);
Daisy::Timing::sleep_ms(static_cast<Daisy::Integer>(10));
}
con_cal = c1.await();
con_col = c2.await();
con_tex = c3.await();
Daisy::builtin::io::print("The total poulation is:", population);
Daisy::builtin::io::print("California has a population of", con_cal);
Daisy::builtin::io::print("Colorado   has a population of", con_col);
Daisy::builtin::io::print("Texas      has a population of", con_tex);


Daisy::Threads::join_all();
return 0;
}
}
