#include <runtime/runtime.hpp>
#include <cstdint>
#include <cstdio>
#include <string>

inline auto a = Daisy::List<Daisy::Integer>({static_cast<Daisy::Integer>(1), static_cast<Daisy::Integer>(2), static_cast<Daisy::Integer>(9), static_cast<Daisy::Integer>(4)});
inline auto b = Daisy::NewShared(Daisy::List<Daisy::String>({"apples", "oranges"}));
inline auto c = Daisy::NewShared(Daisy::List<Daisy::Integer>({static_cast<Daisy::Integer>(7), static_cast<Daisy::Integer>(10), static_cast<Daisy::Integer>(9)}));
inline auto d = Daisy::List<Daisy::List<Daisy::Integer>>({Daisy::List<Daisy::Integer>({static_cast<Daisy::Integer>(1), static_cast<Daisy::Integer>(2), static_cast<Daisy::Integer>(3)}), Daisy::List<Daisy::Integer>({static_cast<Daisy::Integer>(4), static_cast<Daisy::Integer>(5), static_cast<Daisy::Integer>(6)})});
DAISY_FUNCTION(void, worker, Daisy::SharedList<Daisy::Integer> l)
{
b->setAt(static_cast<Daisy::Integer>(1),"bluebes");
l->setAt(static_cast<Daisy::Integer>(1),static_cast<Daisy::Integer>(8));

}


int main() {
a[static_cast<Daisy::Integer>(2)] = static_cast<Daisy::Integer>(3);
Daisy::Threads::spawn(worker , c).await();
Daisy::print(a);
Daisy::print(b);
Daisy::print(c);
Daisy::print(d);
  Daisy::Threads::join_all();
  return 0;
}
