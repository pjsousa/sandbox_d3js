"use strict";
function module_fn(global){
    
    global.ddengine = global.ddengine || {};
    global.ddengine.factories = global.ddengine.factories || {};

    const static_X =[ 0.0000000000, 0.5384693101, -0.5384693101, 0.9061798459, -0.9061798459 ];

    const static_C = [ 0.5688888889, 0.4786286705, 0.4786286705, 0.2369268850, 0.2369268850 ];
 
    function BSpline(positions, count, startTime, endTime){
        // set up arrays
        this.mPositions = Array(count+4);
        this.mTimes = Array(count+2);
        this.mCount = count+4;
        this.mLengths = Array(this.mCount-3);
        this.mTotalLength = 0.0;

        // copy position data
        // triplicate start and end points so that curve passes through them
        this.mPositions[0] = this.mPositions[1] = positions[0];
        let i;
        for ( i = 0; i < count; ++i )
        {
            this.mPositions[i+2] = positions[i];
        }
        this.mPositions[this.mCount-1] = this.mPositions[this.mCount-2] = positions[count-1];

        // now set up times
        // we subdivide interval to get arrival times at each knot location
        let dt = (endTime - startTime)/(count+1);
        this.mTimes[0] = startTime;
        for ( i = 0; i < count; ++i )
        {
            this.mTimes[i+1] = this.mTimes[i]+dt;
        }
        this.mTimes[count+1] = endTime;

        // set up curve segment lengths
        for ( i = 0; i < this.mCount-3; ++i )
        {
            this.mLengths[i] = this.segmentArcLength(i, 0.0, 1.0);
            this.mTotalLength += this.mLengths[i];
        }
    }

    BSpline.prototype.init = function(){
    };

    BSpline.prototype.evaluate = function(t){
        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            return this.mPositions[0];
        else if ( t >= this.mTimes[this.mCount-3] )
            return this.mPositions[this.mCount-3];

        // find segment and parameter
        let i;  // segment #
        for ( i = 0; i < this.mCount-3; ++i )
        {
            if ( t <= this.mTimes[i+1] )
            {
                break;
            }
        }

        let t0 = this.mTimes[i];
        let t1 = this.mTimes[i+1];
        let u = (t - t0)/(t1 - t0);

        // match segment index to standard B-spline terminology
        i += 3;

        // evaluate
        let A = this.mPositions[i] - 3.0 * this.mPositions[i-1] + 3.0 * this.mPositions[i-2] - this.mPositions[i-3];
        let B = 3.0 * this.mPositions[i-1] - 6.0 * this.mPositions[i-2] + 3.0 * this.mPositions[i-3];
        let C = 3.0 * this.mPositions[i-1] - 3.0 * this.mPositions[i-3];
        let D = this.mPositions[i-1] + 4.0 * this.mPositions[i-2] + this.mPositions[i-3];

        return (D + u*(C + u*(B + u*A))) / 6.0;
    };

    BSpline.prototype.velocity = function(t){
        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            t = this.mTimes[0];
        else if ( t >= this.mTimes[this.mCount-3] )
            t = this.mTimes[this.mCount-3];

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

        // match segment index to standard B-spline terminology
        i += 3;

        // evaluate
        let A = this.mPositions[i] - 3.0 * this.mPositions[i-1] + 3.0 * this.mPositions[i-2] - this.mPositions[i-3];
        let B = 3.0 * this.mPositions[i-1] - 6.0 * this.mPositions[i-2] + 3.0 * this.mPositions[i-3];
        let C = 3.0 * this.mPositions[i-1] - 3.0 * this.mPositions[i-3];
        
        let result = (C + u*(2.0*B + 3.0*u*A))/6.0;

        return result;
    };

    BSpline.prototype.acceleration = function(t){
        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            t = 0.0;
        else if ( t > this.mTimes[this.mCount-3] )
            t = this.mTimes[this.mCount-3];

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

        // match segment index to standard B-spline terminology
        i += 3;

        // evaluate
        let A = this.mPositions[i] - 3.0*this.mPositions[i-1] + 3.0*this.mPositions[i-2] - this.mPositions[i-3];
        let B = 3.0*this.mPositions[i-1] - 6.0*this.mPositions[i-2] + 3.0*this.mPositions[i-3];
        
        return 1.0/3.0*B + u*A;

    };

    BSpline.prototype.findParameterByDistance = function(t1, s){
        // initialize bisection endpoints
        let a = t1;
        let b = this.mTimes[this.mCount-3];

        // ensure that we remain within valid parameter space
        if ( s >= this.arcLength(t1, b) )
            return b;
        if ( s <= 0.0 )
            return a;

        // make first guess
        let p = t1 + s*(this.mTimes[this.mCount-3]-this.mTimes[0])/this.mTotalLength;

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
            if ( func < 0.0 )
            {
                a = p;
            }
            else
            {
                b = p;
            }

            // get speed along curve
            let speed = this.velocity(p).Length();

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

    BSpline.prototype.arcLength = function(t1, t2){
        if ( t2 <= t1 )
            return 0.0;

        if ( t1 < this.mTimes[0] )
            t1 = this.mTimes[0];

        if ( t2 > this.mTimes[this.mCount-3] )
            t2 = this.mTimes[this.mCount-3];

        // find segment and parameter
        let seg1;
        for ( seg1 = 0; seg1 < this.mCount-1; ++seg1 )
        {
            if ( t1 <= this.mTimes[seg1+1] )
            {
                break;
            }
        }
        let u1 = (t1 - this.mTimes[seg1])/(this.mTimes[seg1+1] - this.mTimes[seg1]);
        
        // find segment and parameter
        let seg2;
        for ( seg2 = 0; seg2 < this.mCount-1; ++seg2 )
        {
            if ( t2 <= this.mTimes[seg2+1] )
            {
                break;
            }
        }
        let u2 = (t2 - this.mTimes[seg2])/(this.mTimes[seg2+1] - this.mTimes[seg2]);
        
        let result;
        // both parameters lie in one segment
        if ( seg1 == seg2 )
        {
            result = this.segmentArcLength( seg1, u1, u2 );
        }
        // parameters cross segments
        else
        {
            result = this.segmentArcLength( seg1, u1, 1.0 );
            for ( let i = seg1+1; i < seg2; ++i )
                result += this.mLengths[i];
            result += this.segmentArcLength( seg2, 0.0, u2 );
        }

        return result;
    };

    BSpline.prototype.segmentArcLength = function(i, u1, u2){
        
        if ( u2 <= u1 )
            return 0.0;

        if ( u1 < 0.0 )
            u1 = 0.0;

        if ( u2 > 1.0 )
            u2 = 1.0;

        // reindex to use standard B-spline segment count
        i += 3;

        // use Gaussian quadrature
        let sum = 0.0;
        // set up for computation of IvUniformBSpline derivative
        let A = this.mPositions[i] - 3.0*this.mPositions[i-1] + 3.0*this.mPositions[i-2] - this.mPositions[i-3];
        let B = 3.0*this.mPositions[i-1] - 6.0*this.mPositions[i-2] + 3.0*this.mPositions[i-3];
        let C = 3.0*this.mPositions[i-1] - 3.0*this.mPositions[i-3];
        
        for ( let j = 0; j < 5; ++j )
        {
            let u = 0.5*((u2 - u1)*static_X[j] + u2 + u1);
            let derivative = (C + u*(2.0*B + 3.0*u*A))/6.0;
            sum += static_C[j]*derivative.Length();
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

    global.ddengine.BSpline = BSpline;
}

(function(){
   try{
        module_fn(window);
   }
   catch(e){
        module_fn(module.exports);
   }
})();