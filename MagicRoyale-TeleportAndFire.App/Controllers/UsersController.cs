using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MagicRoyale_TeleportAndFire.Entity;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace MagicRoyale_TeleportAndFire.App.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUsersManager _usersManager;
        
        public UsersController(IUsersManager usersManager)
        {
            _usersManager = usersManager;
        }

        [HttpPost, Consumes("application/json")]
        public async Task<User> Create([FromBody] CreateUserRequest request)
        {
            return await _usersManager.Create(request);
        }
    }
}