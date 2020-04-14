"use strict";
function module_fn(global){
    
    global.ddengine = global.ddengine || {};
    global.ddengine.factories = global.ddengine.factories || {};

    const static_X =[ 0.0000000000, 0.5384693101, -0.5384693101, 0.9061798459, -0.9061798459 ];

    const static_C = [ 0.5688888889, 0.4786286705, 0.4786286705, 0.2369268850, 0.2369268850 ];
 
    function CatmullRom(positions, times, count){
        this.mPositions = Array(count);
        this.mTimes = Array(count);
        this.mLengths = Array(count - 1);
        this.mTotalLength = 0.0;
        this.mCount = count;

        // copy data
        let i;
        for ( i = 0; i < count; ++i )
        {
            this.mPositions[i] = positions[i];
            this.mTimes[i] = times[i];
        }

        // set up curve segment lengths
        for ( i = 0; i < count-1; ++i )
        {
            this.mLengths[i] = this.segmentArcLength(i, 0.0, 1.0);
            this.mTotalLength += this.mLengths[i];
        }
    }

    CatmullRom.prototype.init = function(){
    };

    CatmullRom.prototype.evaluate = function(t){

        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            return this.mPositions[0];
        else if ( t >= this.mTimes[this.mCount-1] )
            return this.mPositions[this.mCount-1];

        // find segment and parameter
        let i;  // segment #
        for ( i = 0; i < this.mCount-1; ++i )
        {
            if ( t <= this.mTimes[i+1] )
            {
                break;
            }
        }

        let t0 = this.mTimes[i];
        let t1 = this.mTimes[i+1];
        let u = (t - t0)/(t1 - t0);

        // quadratic Catmull-Rom for Q_0
        let A, B, C;
        if (i == 0)
        {
            A = this.mPositions[0].subtract(this.mPositions[1].multiplyScalar(2.0)).add(this.mPositions[2]);
            B = this.mPositions[1].multiplyScalar(4.0).subtract(this.mPositions[0].multiplyScalar(3.0)).subtract(this.mPositions[2]);
            
            return this.mPositions[0].add((B.add(A.multiplyScalar(u))).multiplyScalar(0.5*u));
        }
        // quadratic Catmull-Rom for Q_n-1
        else if (i >= this.mCount-2)
        {
            i = this.mCount-2;
            A = this.mPositions[i-1].subtract(this.mPositions[i].multiplyScalar(2.0)).add(this.mPositions[i+1]);
            B = this.mPositions[i+1].subtract(this.mPositions[i-1]);
            
            return this.mPositions[i].add((B.add(A.multiplyScalar(u))).multiplyScalar(0.5*u));
        }
        // cubic Catmull-Rom for interior segments
        else
        {
            // evaluate
            A = this.mPositions[i].multiplyScalar(3.0)
                .subtract(this.mPositions[i-1])
                .subtract(this.mPositions[i+1].multiplyScalar(3.0))
                .add(this.mPositions[i+2]);
            B = this.mPositions[i-1].multiplyScalar(2.0).subtract(this.mPositions[i].multiplyScalar(5.0)).add(this.mPositions[i+1].multiplyScalar(4.0)).subtract(this.mPositions[i+2]);
            C = this.mPositions[i+1].subtract(this.mPositions[i-1]);
        
            return this.mPositions[i].add(C.add(B.add(A.multiplyScalar(u)).multiplyScalar(u)).multiplyScalar((0.5*u)));
        }
    };

    CatmullRom.prototype.velocity = function(t){
        
        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            t = 0.0;
        else if ( t > this.mTimes[this.mCount-1] )
            t = this.mTimes[this.mCount-1];

        // find segment and parameter
        let i;
        for ( i = 0; i < this.mCount-1; ++i )
        {
            if ( t <= this.mTimes[i+1] )
            {
                break;
            }
        }
        let t0 = this.mTimes[i];
        let t1 = this.mTimes[i+1];
        let u = (t - t0)/(t1 - t0);

        // evaluate
        // quadratic Catmull-Rom for Q_0
        let A, B, C;
        if (i == 0)
        {
            A = this.mPositions[0] - 2.0*this.mPositions[1] + this.mPositions[2];
            B = 4.0*this.mPositions[1] - 3.0*this.mPositions[0] - this.mPositions[2];
            
            return 0.5*B + u*A;
        }
        // quadratic Catmull-Rom for Q_n-1
        else if (i >= this.mCount-2)
        {
            i = this.mCount-2;
            A = this.mPositions[i-1] - 2.0*this.mPositions[i] + this.mPositions[i+1];
            B = this.mPositions[i+1] - this.mPositions[i-1];
            
            return 0.5*B + u*A;
        }
        // cubic Catmull-Rom for interior segments
        else
        {
            // evaluate
            A = 3.0*this.mPositions[i] - this.mPositions[i-1] - 3.0*this.mPositions[i+1] + this.mPositions[i+2];
            B = 2.0*this.mPositions[i-1] - 5.0*this.mPositions[i] + 4.0*this.mPositions[i+1] - this.mPositions[i+2];
            C = this.mPositions[i+1] - this.mPositions[i-1];
        
            return 0.5*C + u*(B + 1.5*u*A);
        }

    };

    CatmullRom.prototype.acceleration = function(t){

        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            t = 0.0;
        else if ( t > this.mTimes[this.mCount-1] )
            t = this.mTimes[this.mCount-1];

        // find segment and parameter
        let i;
        for ( i = 0; i < this.mCount-1; ++i )
        {
            if ( t <= this.mTimes[i+1] )
            {
                break;
            }
        }
        let t0 = this.mTimes[i];
        let t1 = this.mTimes[i+1];
        let u = (t - t0)/(t1 - t0);

        // evaluate
        // quadratic Catmull-Rom for Q_0
        if (i == 0)
        {
            return this.mPositions[0] - 2.0*this.mPositions[1] + this.mPositions[2];
        }
        // quadratic Catmull-Rom for Q_n-1
        else if (i >= this.mCount-2)
        {
            i = this.mCount-2;
            return this.mPositions[i-1] - 2.0*this.mPositions[i] + this.mPositions[i+1];
        }
        // cubic Catmull-Rom for interior segments
        else
        {
            // evaluate
            let A = 3.0*this.mPositions[i] - this.mPositions[i-1] - 3.0*this.mPositions[i+1] + this.mPositions[i+2];
            let B = 2.0*this.mPositions[i-1] - 5.0*this.mPositions[i] + 4.0*this.mPositions[i+1] - this.mPositions[i+2];
        
            return B + (3.0*u)*A;
        }

    };

    CatmullRom.prototype.findParameterByDistance = function(t1, s){
        // initialize bisection endpoints
        let a = t1;
        let b = this.mTimes[this.mCount-1];

        // ensure that we remain within valid parameter space
        if ( s >= this.arcLength(t1, b) )
            return b;
        if ( s <= 0.0 )
            return a;

        // make first guess
        let p = t1 + s*(this.mTimes[this.mCount-1]-this.mTimes[0])/this.mTotalLength;

        // iterate and look for zeros
        for ( let i = 0; i < 32; ++i )
        {
            // compute function value and test against zero
            let func = this.arcLength(t1, p) - s;
            if ( Math.abs(func) < 1.0e-3 )
            {
                return p;
            }

            // update bisection endpoints
            if ( func < 0.0 ){
                a = p;
            }
            else{
                b = p;
            }

            // get speed along curve
            let speed = length(this.velocity(p));

            // if result will lie outside [a,b] 
            if ( ((p-a)*speed - func)*((p-b)*speed - func) > -1.0e-3 )
            {
                // do bisection
                p = 0.5*(a+b);
            }    
            else
            {
                // otherwise Newton-Raphson
                p -= func/speed;
            }
        }

        // done iterating, return failure case
        return Number.MAX_VALUE;
    };

    CatmullRom.prototype.arcLength = function(t1, t2){
        if ( t2 <= t1 )
            return 0.0;

        if ( t1 < this.mTimes[0] )
            t1 = this.mTimes[0];

        if ( t2 > this.mTimes[this.mCount-1] )
            t2 = this.mTimes[this.mCount-1];

        // find segment and parameter
        let seg1;
        for ( seg1 = 0; seg1 < this.mCount-1; ++seg1 ){
            if ( t1 <= this.mTimes[seg1+1] ){
                break;
            }
        }
        let u1 = (t1 - this.mTimes[seg1])/(this.mTimes[seg1+1] - this.mTimes[seg1]);
        
        // find segment and parameter
        let seg2;
        for ( seg2 = 0; seg2 < this.mCount-1; ++seg2 ){
            if ( t2 <= this.mTimes[seg2+1] ){
                break;
            }
        }
        let u2 = (t2 - this.mTimes[seg2])/(this.mTimes[seg2+1] - this.mTimes[seg2]);
        
        let result;
        // both parameters lie in one segment
        if ( seg1 == seg2 ){
            result = this.segmentArcLength( seg1, u1, u2 );
        }
        // parameters cross segments
        else{
            result = this.segmentArcLength( seg1, u1, 1.0 );
            for ( let i = seg1+1; i < seg2; ++i )
                result += this.mLengths[i];
            result += this.segmentArcLength( seg2, 0.0, u2 );
        }

        return result;
    };

    CatmullRom.prototype.segmentArcLength = function(i, u1, u2){
        
        if ( u2 <= u1 )
            return 0.0;
    
        if ( u1 < 0.0 )
            u1 = 0.0;
    
        if ( u2 > 1.0 )
            u2 = 1.0;
    
        // use Gaussian quadrature
        let sum = 0.0;
        let A, B, C;
        if (i == 0)
        {
            //A = this.mPositions[0] - 2.0*this.mPositions[1] + this.mPositions[2];
            let a1 = this.mPositions[0];
            let a2 = this.mPositions[1].multiplyScalar(2.0);
            let a3 = this.mPositions[2];
            A = a1.subtract(a2).add(a3);
            //B = 4.0*this.mPositions[1] - 3.0*this.mPositions[0] - this.mPositions[2];
            let b1 = this.mPositions[1].multiplyScalar(4.0);
            let b2 = this.mPositions[0].multiplyScalar(3.0);
            let b3 = this.mPositions[2];
            B = b1.subtract(b2).subtract(b3);
        }
        // quadratic Catmull-Rom for Q_n-1
        else if (i >= this.mCount-2)
        {
            i = this.mCount-2;
            //A = this.mPositions[i-1] - 2.0*this.mPositions[i] + this.mPositions[i+1];
            let a1 = this.mPositions[i-1];
            let a2 = this.mPositions[i].multiplyScalar(2.0);
            let a3 = this.mPositions[i+1]
            A = a1.subtract(a2).add(a3);
            B = this.mPositions[i+1].subtract(this.mPositions[i-1]);
        }
        // cubic Catmull-Rom for interior segments
        else
        {
            //A = 3.0*this.mPositions[i] - this.mPositions[i-1] - 3.0*this.mPositions[i+1] + this.mPositions[i+2];
            let a1 = this.mPositions[i].multiplyScalar(3.0);
            let a2 = this.mPositions[i-1];
            let a3 = this.mPositions[i+1].multiplyScalar(3.0);
            let a4 = this.mPositions[i+2];
            A = a1.subtract(a2).subtract(a3).add(a4);

            //B = 2.0*this.mPositions[i-1] - 5.0*this.mPositions[i] + 4.0*this.mPositions[i+1] - this.mPositions[i+2];
            let b1 = this.mPositions[i-1].multiplyScalar(2.0);
            let b2 = this.mPositions[i].multiplyScalar(5.0);
            let b3 = this.mPositions[i+1].multiplyScalar(4.0);
            let b4 = this.mPositions[i+2];
            B = b1.subtract(b2).add(b3).subtract(b4);
            C = this.mPositions[i+1].subtract(this.mPositions[i-1]);
        }
        
        for ( let j = 0; j < 5; ++j )
        {
            let u = 0.5*((u2 - u1)*static_X[j] + u2 + u1);
            let derivative;
            if ( i == 0 || i >= this.mCount-2)
                derivative = B.multiplyScalar(0.5).add(A.multiplyScalar(u));
            else
                derivative = C.multiplyScalar(0.5).add((B.add(A.multiplyScalar(1.5*u))).multiplyScalar(u));
            sum += static_C[j]*length(derivative);
        }
        sum *= 0.5*(u2-u1);
    
        return sum;
    };

    function length(vector){
        let sum = 0;
        let s = vector.size();
        let v;
        for(let i = 0; i < s; i++){
            v = vector.r(i, 0);
            sum += v * v;
        }

        return Math.sqrt(sum);
    }

    global.ddengine.CatmullRom = CatmullRom;
}

(function(){
   try{
        module_fn(window);
   }
   catch(e){
        module_fn(module.exports);
   }
})();