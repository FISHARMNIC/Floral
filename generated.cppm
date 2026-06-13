
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

export module test_delme;

DAISY_FUNCTION(void, c, )
Daisy::builtin::io::print("C");

}
DAISY_FUNCTION(void, b, )
Daisy::Threads::spawn(c);

}
DAISY_FUNCTION(void, a, )
Daisy::Threads::spawn(b);

}


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/test_delme.bud";

Daisy::Threads::spawn(a).await();


Daisy::Threads::join_all();
return 0;
}
}
