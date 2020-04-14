"use strict";
function module_fn(global){
    
    global.ddengine = global.ddengine || {};
    global.ddengine.factories = global.ddengine.factories || {};

    const static_X =[ 0.0000000000, 0.5384693101, -0.5384693101, 0.9061798459, -0.9061798459 ];

    const static_C = [ 0.5688888889, 0.4786286705, 0.4786286705, 0.2369268850, 0.2369268850 ];

    function Hermite(positions, inTangents, outTangents, times, count){
        this.mPositions = Array(count);
        this.mInTangents = Array(count - 1);
        this.mOutTangents = Array(count - 1);
        this.mTimes = Array(count);
        this.mLengths = Array(count - 1);
        this.mTotalLength = 0.0;
        this.mCount = count;

        // copy data
        for ( let i = 0; i < count; ++i ){
            this.mPositions[i] = positions[i];
            if ( i < count-1 ){
                this.mInTangents[i] = inTangents[i];
                this.mOutTangents[i] = outTangents[i];
            }
            this.mTimes[i] = times[i];
        }

        // set up curve segment lengths
        for ( let i = 0; i < count-1; ++i ){
            this.mLengths[i] = this.segmentArcLength(i, 0, 1);
            this.mTotalLength += this.mLengths[i];
        }

        //this.rebuildVertexBuffers();
    }

    Hermite.prototype.init = function(){
    };

    Hermite.prototype.initClamped = function(positions, times, count, inTangent, outTangent){
        this.mPositions = Array(count);
        this.mInTangents = Array(count - 1);
        this.mOutTangents = Array(count - 1);
        this.mTimes = Array(count);
        this.mLengths = Array(count - 1);
        this.mTotalLength = 0.0;
        this.mCount = count;

        // build A
        let n = count;
        let A = Array(n*n).fill(0);

        A[0] = 1.0;
        let i;
        for ( i = 1; i < n-1; ++i )
        {
            A[i + n*i - n] = 1.0;
            A[i + n*i] = 4.0;
            A[i + n*i + n] = 1.0;
        }
        A[n*n-1] = 1.0;

        // invert it
        // we'd might get better accuracy if we solve the linear system 3 times,
        // once each for x, y, and z, but this is more efficient
        if (!InvertMatrix( A, n ))
        {
            return false;
        }

        // handle end conditions
        this.mPositions[0] = positions[0];
        this.mTimes[0] = times[0];
        this.mOutTangents[0] = outTangent;
        this.mPositions[count-1] = positions[count-1];
        this.mTimes[count-1] = times[count-1];
        this.mInTangents[count-2] = inTangent;

        // set up the middle
        for ( i = 1; i < count-1; ++i )
        {
            // copy position and time
            this.mPositions[i] = positions[i];
            this.mTimes[i] = times[i];

            // multiply b by inverse of A to get x
            this.mOutTangents[i] = outTangent.multiplyScalar(A[i]).add(inTangent.multiplyScalar(A[i + n*n-n]));
            for ( let j = 1; j < n-1; ++j )
            {
                let b_j = positions[j+1].subtract(positions[j-1]).multiplyScalar(3.0);
                this.mOutTangents[i] = this.mOutTangents[i].add(this.mOutTangents[i].add(b_j.multiplyScalar(A[i + n*j])));
            }

            // in tangent is out tangent of next segment
            this.mInTangents[i-1] = this.mOutTangents[i];
        }

        // set up curve segment lengths
        this.mTotalLength = 0.0;
        for ( i = 0; i < count-1; ++i )
        {
            this.mLengths[i] = this.segmentArcLength(i, 0.0, 1.0);
            this.mTotalLength += this.mLengths[i];
        }

        return true;
    };

    Hermite.prototype.initNatural = function(positions, times, count){
        // copy positions and times
        for ( let i = 0; i < count; ++i )
        {
            this.mPositions[i] = positions[i];
            this.mTimes[i] = times[i];
        }

        // build tangent data
        let n = count;
        let L;                                                // current lower diagonal matrix entry
        let U = Array(n);                                     // upper diagonal matrix entries
        let z = Array(n);                                      // solution of lower diagonal system Lz = b

        // solve for upper matrix and partial solution z
        L = 2.0;
        U[0] = 0.5;
        z[0] = positions[1].subtract(positions[0]).multiplyScalar(3.0*L);
        for ( let i = 1; i < n-1; ++i )
        {
            // add internal entry to linear system for smooth spline
            L = 4.0 - U[i-1];
            U[i] = 1.0/L;
            z[i] = positions[i+1]
                    .subtract(positions[i-1])
                    .multiplyScalar(3.0)
                    .subtract(z[i-1])
                    .multiplyScalar(1/L);
        }
        L = 2.0 - U[n-2];
        z[n-1] = positions[n-1]
                .subtract(positions[n-2])
                .multiplyScalar(3.0)
                .subtract(z[n-2])
                .multiplyScalar(1/L);

        // solve Ux = z (see Burden and Faires for details)
        this.mInTangents[n-2] = z[n-1];
        for ( let i = n-2; i > 0; --i )
        {
            this.mInTangents[i-1] = z[i].subtract(this.mInTangents[i].multiplyScalar(U[i]));
            this.mOutTangents[i] = this.mInTangents[i-1];
        }
        this.mOutTangents[0] = z[0].subtract(this.mInTangents[0].multiplyScalar(U[0]));

        for ( let i = 0; i < count-1; ++i )
        {
            this.mLengths[i] = this.segmentArcLength(i, 0.0, 1.0);
            this.mTotalLength += this.mLengths[i];
        }
    };

    Hermite.prototype.evaluate = function(t){

        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            return this.mPositions[0];
        else if ( t >= this.mTimes[this.mCount-1] )
            return this.mPositions[this.mCount-1];

        // find segment and parameter
        let i = 0;
        for (i = 0; i < this.mCount-1; ++i )
        {
            if ( t < this.mTimes[i+1] )
            {
                break;
            }
        }

        let t0 = this.mTimes[i];
        let t1 = this.mTimes[i+1];
        let u = (t - t0)/(t1 - t0);

        // evaluate
        //let A = 2.0 * this.mPositions[i] - 2.0 * this.mPositions[i+1] + this.mInTangents[i] + this.mOutTangents[i];
        let a1 = this.mPositions[i].multiplyScalar(2.0);
        let a2 = this.mPositions[i+1].multiplyScalar(-2.0);
        let a3 = this.mInTangents[i].add(this.mOutTangents[i]);
        let A = a1.add(a2).add(a3);
        //let B = -3.0 * this.mPositions[i] + 3.0 * this.mPositions[i+1] - this.mInTangents[i] - 2.0 * this.mOutTangents[i];
        let b1 = this.mPositions[i].multiplyScalar(-3.0);
        let b2 = this.mPositions[i+1].multiplyScalar(3.0);
        let b3 = this.mInTangents[i].multiplyScalar(-1.0);
        let b4 = this.mOutTangents[i].multiplyScalar(-2.0);
        let B = b1.add(b2).add(b3).add(b4);

        //let result = this.mPositions[i] + u*(this.mOutTangents[i] + u*(B + u*A));
        let result = this.mPositions[i].add(this.mOutTangents[i].add(B.add(A.multiplyScalar(u)).multiplyScalar(u)).multiplyScalar(u));

        return result;
    };

    Hermite.prototype.velocity = function(t){
        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            return this.mOutTangents[0];
        else if ( t >= this.mTimes[this.mCount-1] )
            return this.mInTangents[this.mCount-2];

        // find segment and parameter
        let i;
        for ( i = 0; i < this.mCount - 1; ++i )
        {
            if ( t < this.mTimes[i+1] )
            {
                break;
            }
        }
        let t0 = this.mTimes[i];
        let t1 = this.mTimes[i+1];
        let u = (t - t0)/(t1 - t0);

        // evaluate
        //let A = 2.0 * this.mPositions[i] - 2.0 * this.mPositions[i+1] + this.mInTangents[i] + this.mOutTangents[i];
        
        let a1 = this.mPositions[i].multiplyScalar(2.0);
        let a2 = this.mPositions[i+1].multiplyScalar(-2.0);
        let a3 = this.mInTangents[i].add(this.mOutTangents[i]);
        let A = a1.add(a2).add(a3);
        //let B = -3.0 * this.mPositions[i] + 3.0 * this.mPositions[i+1] - this.mInTangents[i] - 2.0*this.mOutTangents[i];
        let b1 = this.mPositions[i].multiplyScalar(-3.0);
        let b2 = this.mPositions[i+1].multiplyScalar(3.0);
        let b3 = this.mInTangents[i].multiplyScalar(-1.0);
        let b4 = this.mOutTangents[i].multiplyScalar(-2.0);
        let B = b1.add(b2).add(b3).add(b4);

        let result = this.mOutTangents[i].add(B.multiplyScalar(2.0).add(A.multiplyScalar(u*3.0)).multiplyScalar(u));
        return result;
    };

    Hermite.prototype.acceleration = function(t){
        // handle boundary conditions
        if ( t <= this.mTimes[0] )
            t = 0.0;
        else if ( t > this.mTimes[this.mCount-1] )
            t = this.mTimes[this.mCount-1];

        // find segment and parameter
        let i;
        for ( i = 0; i < this.mCount-1; ++i ){
            if ( t <= this.mTimes[i+1] ){
                break;
            }
        }

        let t0 = this.mTimes[i];
        let t1 = this.mTimes[i+1];
        let u = (t - t0)/(t1 - t0);

        // evaluate
        //let A = 2.0 * this.mPositions[i] - 2.0 * this.mPositions[i+1] + this.mInTangents[i] + this.mOutTangents[i];
        
        let a1 = this.mPositions[i].multiplyScalar(2.0);
        let a2 = this.mPositions[i+1].multiplyScalar(-2.0);
        let a3 = this.mInTangents[i].add(this.mOutTangents[i]);
        let A = a1.add(a2).add(a3);
        //let B = -3.0 * this.mPositions[i] + 3.0 * this.mPositions[i+1] - this.mInTangents[i] - 2.0*this.mOutTangents[i];
        let b1 = this.mPositions[i].multiplyScalar(-3.0);
        let b2 = this.mPositions[i+1].multiplyScalar(3.0);
        let b3 = this.mInTangents[i].multiplyScalar(-1.0);
        let b4 = this.mOutTangents[i].multiplyScalar(-2.0);
        let B = b1.add(b2).add(b3).add(b4);
        
        let result = B.multiplyScalar(2.0).add(A.multiplyScalar(6.0*u));

        return result;
    };

    Hermite.prototype.findParameterByDistance = function(t1, s){
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

    Hermite.prototype.arcLength = function(t1, t2){
        if ( t2 <= t1 )
            return 0.0;

        if ( t1 < this.mTimes[0] )
            t1 = this.mTimes[0];

        if ( t2 > this.mTimes[this.mCount-1] )
            t2 = this.mTimes[this.mCount-1];

        // find segment and parameter
        let seg1;
        for ( seg1 = 0; seg1 < this.mCount-1; ++seg1 ){
            if ( t1 < this.mTimes[seg1+1] ){
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

    Hermite.prototype.segmentArcLength = function(i, u1, u2){
        if ( u2 <= u1 )
            return 0.0;

        if ( u1 < 0.0 )
            u1 = 0.0;

        if ( u2 > 1.0 )
            u2 = 1.0;

        // use Gaussian quadrature
        let sum = 0.0;
        // set up for computation of IvHermite derivative
        //let A = 2.0 * this.mPositions[i] - 2.0 * this.mPositions[i+1] + this.mInTangents[i] + this.mOutTangents[i];
        let a1 = this.mPositions[i].multiplyScalar(2.0);
        let a2 = this.mPositions[i+1].multiplyScalar(-2.0);
        let a3 = this.mInTangents[i].add(this.mOutTangents[i]);
        let A = a1.add(a2).add(a3);
        //let B = -3.0 * this.mPositions[i] + 3.0 * this.mPositions[i+1] - this.mInTangents[i] - 2.0 * this.mOutTangents[i];
        let b1 = this.mPositions[i].multiplyScalar(-3.0);
        let b2 = this.mPositions[i+1].multiplyScalar(3.0);
        let b3 = this.mInTangents[i].multiplyScalar(-1.0);
        let b4 = this.mOutTangents[i].multiplyScalar(-2.0);
        let B = b1.add(b2).add(b3).add(b4);
        let C = this.mInTangents[i];
        
        for ( let j = 0; j < 5; ++j )
        {
            let u = 0.5*((u2 - u1)*static_X[j] + u2 + u1);
            //let derivative = C + u*(2.0*B + 3.0*u*A);
            let derivative = C.add(B.multiplyScalar(2.0).add(A.multiplyScalar(3.0 * u)).multiplyScalar(u));
            sum += C.r(j,0) * length(derivative);
        }
        sum *= 0.5 * (u2 - u1);

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

    function IvIsZero(v){
        return Math.abs(v) <= 1.0e-6;
    }
    
    function InvertMatrix( A, n )
    {
        let swap = Array(n).fill(0);

        // do one pass for each diagonal element
        for ( let pivot = 0; pivot < n; ++pivot )
        {
            let row, col;  // counters

            // find the largest magnitude element in the current column
            let maxrow = pivot;
            let maxelem = Math.abs( A[ maxrow + n*pivot ] );
            for ( row = pivot+1; row < n; ++row )
            {
                let elem = Math.abs( A[ row + n*pivot ] );
                if ( elem > maxelem )
                {
                    maxelem = elem;
                    maxrow = row;
                }
            }

            // if max is zero, stop!
            if ( IvIsZero( maxelem ) )
            {
                return false;
            }

            // if not in the current row, swap rows
            swap[pivot] = maxrow;
            if ( maxrow != pivot )
            {
                // swap the row
                for ( col = 0; col < n; ++col )
                {
                    let temp = A[ maxrow + n*col ];
                    A[ maxrow + n*col ] = A[ pivot + n*col ];
                    A[ pivot + n*col ] = temp;
                }
            }
        
            // multiply current row by 1/pivot to "set" pivot to 1
            let pivotRecip = 1.0/A[ n*pivot + pivot ];
            for ( col = 0; col < n; ++col )
            {
                A[ pivot + n*col ] *= pivotRecip;
            }

            // copy 1/pivot to pivot point (doing inverse in place)
            A[pivot + n*pivot] = pivotRecip;

            // now zero out pivot column in other rows 
            for ( row = 0; row < n; ++row )
            {
                // don't subtract from pivot row
                if ( row == pivot )
                    continue;
                
                // subtract multiple of pivot row from current row,
                // such that pivot column element becomes 0
                let factor = A[ row + n*pivot ];

                // clear pivot column element (doing inverse in place)
                // will end up setting this element to -factor*pivotInverse
                A[ row + n*pivot ] = 0.0;
                
                // subtract multiple of row
                for ( col = 0; col < n; ++col )
                {
                    A[ row + n*col ] -= factor*A[ pivot + n*col ];   
                }
            }
        }

        // done, undo swaps in column direction, in reverse order
        let p = n;
        do
        {
            --p;
            // if row has been swapped
            if (swap[p] != p)
            {
                // swap the corresponding column
                for ( let row = 0; row < n; ++row )
                {
                    let temp = A[ row + n*swap[p] ];
                    A[ row + n*swap[p] ] = A[ row + n*p ];
                    A[ row + n*p ] = temp;
                }
            }
        }
        while (p > 0);

        return true;

    }   // End of IvMatrix33::Inverse()


    global.ddengine.Hermite = Hermite;

}

(function(){
   try{
        module_fn(window);
   }
   catch(e){
        module_fn(module.exports);
   }
})();