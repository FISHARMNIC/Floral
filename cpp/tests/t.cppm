
module;
#include "../runtime/runtime.hpp"
#include <cstdint>
#include <cstdio>
#include <string>

export module list;

export Daisy::List<Daisy::Integer> a = {};
export Daisy::SharedList<Daisy::String> b = {};
export Daisy::SharedList<Daisy::Integer> c = {};
export Daisy::List<Daisy::List<Daisy::Integer>> d = {};
DAISY_FUNCTION(void, worker, Daisy::SharedList<Daisy::Integer> l)
b->setAt(static_cast<Daisy::Integer>(1), [&](auto __v){ return "bluebes"; });
l->setAt(static_cast<Daisy::Integer>(1), [&](auto __v){ return static_cast<Daisy::Integer>(8); });
}


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/list.bud";

a = Daisy::List<Daisy::Integer>({static_cast<Daisy::Integer>(1), static_cast<Daisy::Integer>(2), static_cast<Daisy::Integer>(9), static_cast<Daisy::Integer>(4)});
b = Daisy::NewShared(Daisy::List<Daisy::String>({"apples", "oranges"}));
c = Daisy::NewShared(Daisy::List<Daisy::Integer>({static_cast<Daisy::Integer>(7), static_cast<Daisy::Integer>(10), static_cast<Daisy::Integer>(9)}));
d = Daisy::List<Daisy::List<Daisy::Integer>>({Daisy::List<Daisy::Integer>({static_cast<Daisy::Integer>(1), static_cast<Daisy::Integer>(2), static_cast<Daisy::Integer>(3)}), Daisy::List<Daisy::Integer>({static_cast<Daisy::Integer>(4), static_cast<Daisy::Integer>(5), static_cast<Daisy::Integer>(6)})});
a[static_cast<Daisy::Integer>(2)] = static_cast<Daisy::Integer>(3);
Daisy::Threads::spawn(worker, c).await();
Daisy::builtin::io::print(a);
Daisy::builtin::io::print(b);
Daisy::builtin::io::print(c);
Daisy::builtin::io::print(d);


Daisy::Threads::join_all();
return 0;
}
}
