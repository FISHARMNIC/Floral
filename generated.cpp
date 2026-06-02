#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

inline auto b = Daisy::NewShared(Daisy::List<Daisy::String>({"apples", "oranges"}));
inline auto c = Daisy::NewShared(Daisy::List<Daisy::Integer>({static_cast<uint64_t>(7), static_cast<uint64_t>(10), static_cast<uint64_t>(9)}));
DAISY_FUNCTION(void, worker, Daisy::SharedList<Daisy::Integer> l)
{
b->setAt(static_cast<uint64_t>(1),"bluebes");
l->setAt(static_cast<uint64_t>(1),static_cast<uint64_t>(8));

}


int main() {
auto a = Daisy::List<Daisy::Integer>({static_cast<uint64_t>(1), static_cast<uint64_t>(2), static_cast<uint64_t>(9), static_cast<uint64_t>(4)});
a[static_cast<uint64_t>(2)] = static_cast<uint64_t>(3);
Daisy::Threads::spawn(worker , c).await();
Daisy::print(a);
Daisy::print(b);
Daisy::print(c);
  Daisy::Threads::join_all();
  return 0;
}
