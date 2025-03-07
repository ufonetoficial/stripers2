<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  Closure  $next
     * @param  string|null  $redirectToRoute
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle($request, Closure $next)
    {
        // Skip routes required for login
        if ($request->routeIs(['voyager.login', 'voyager.postlogin', 'voyager.voyager_assets', 'admin.leaveImpersonation'])) {
            return $next($request);
        }

        // Check if user is admin (non mysqlnd check included)
        if (!(Auth::check() && (Auth::user()->role_id === 1 || Auth::user()->role_id === "1"))) {
            return $request->expectsJson()
                ? abort(403, 'Unauthorized')
                : Redirect::route('voyager.login');
        }

        return $next($request);
    }
}
