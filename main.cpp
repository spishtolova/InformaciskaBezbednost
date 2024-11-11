#include <iostream>
using namespace std;
int main() {
    int i,zbir,d,m;
    int najgolem=0;
    for(i=1000;i<10000;i++) {
        zbir=0;
        najgolem=0;
        for(m=i;m>0;m/=10) {
            d=m%10;
            if(d>najgolem) {
                najgolem=d;

            }
            if(d<najgolem) {
                zbir+=d;
            }
        }
        if(najgolem==zbir) {
            cout<<i<<endl;
        }
    }
    return 0;
}
