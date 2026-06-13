
module;
#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

export module example;

DAISY_FUNCTION(void, worker_wrapper, Daisy::SharedList<std::function<void()>> pool, Daisy::Integer task, Daisy::SharedInteger next_task)
while (task < Daisy::util::listlength(pool->get())) {
Daisy::Threads::spawn([=](auto __ch){ return pool->get()[task](); }).await();
task = next_task->get();
next_task->modify([&](auto __v){ return __v + static_cast<Daisy::Integer>(1); });
}

}
DAISY_FUNCTION(void, work, Daisy::SharedList<std::function<void()>> pool, Daisy::Integer worker_count)
Daisy::List<Daisy::Threads::Handler<void>> workers = {};
Daisy::SharedInteger next_task = Daisy::NewShared(worker_count);
auto i = static_cast<Daisy::Integer>(0);
while (i < worker_count) {
Daisy::builtin::io::print(("Spawning: " + Daisy::util::toString(i)));
Daisy::util::listpush(workers, Daisy::Threads::spawn(worker_wrapper, pool, i, next_task));
i = i + static_cast<Daisy::Integer>(1);
}
Daisy::builtin::io::print("...All workers spawned...");
i = static_cast<Daisy::Integer>(0);
while (i < worker_count) {
Daisy::builtin::io::print(("Awaiting " + Daisy::util::toString(i)));
workers[i].await();
i = i + static_cast<Daisy::Integer>(1);
}

}
DAISY_FUNCTION(void, f1, )
Daisy::builtin::io::print("Hi! How are you");

}
DAISY_FUNCTION(void, f2, )
Daisy::builtin::io::print("Hello from job 2");

}
DAISY_FUNCTION(void, f3, )
Daisy::builtin::io::print("Wassup");

}
export Daisy::List<std::function<void()>> jobs = {};


extern "C++" {
int main() {
Daisy::builtin::file::_exe_path = "/Users/nico/Documents/DaisyLang/examples/longer/pool/example.bud";

jobs = Daisy::List<std::function<void()>>({[&](auto&&... __a){ return Daisy::Threads::call(f1, std::forward<decltype(__a)>(__a)...); }, [&](auto&&... __a){ return Daisy::Threads::call(f2, std::forward<decltype(__a)>(__a)...); }, [&](auto&&... __a){ return Daisy::Threads::call(f3, std::forward<decltype(__a)>(__a)...); }});


Daisy::Threads::join_all();
return 0;
}
}
