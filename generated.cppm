
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

export module signal;

export Daisy::Signal<Daisy::Integer> sig = {};
DAISY_FUNCTION(void, receiver, Daisy::Integer n)
Daisy::Timing::sleep_ms(n);
Daisy::builtin::io::print(("[" + Daisy::util::toString(n) + "] Waiting...."));
auto res = sig.wait();
Daisy::Timing::sleep_ms(n);
Daisy::builtin::io::print(("[" + Daisy::util::toString(n) + "] Got signal...."));

}
DAISY_FUNCTION(void, signaller, )
Daisy::builtin::io::print("[s1] Signalling....");
sig.notify();

}


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/libs/signal.bud";

Daisy::Threads::spawn(receiver, static_cast<Daisy::Integer>(1));
Daisy::Threads::spawn(receiver, static_cast<Daisy::Integer>(2));
Daisy::Timing::sleep_ms(static_cast<Daisy::Integer>(10));
Daisy::Threads::call(signaller  );


Daisy::Threads::join_all();
return 0;
}
}
